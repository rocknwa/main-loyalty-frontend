import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import {
  generateNonce,
  generateRandomness,
  jwtToAddress,
} from '@mysten/zklogin';
import { toBigIntBE } from 'bigint-buffer';
import { decodeJwt } from 'jose';
import { toast } from 'react-hot-toast';

import {
  AccountData,
  OpenIdProvider,
  PartialZkLoginSignature,
  SaltAPIResponse,
  SetupData,
} from '@/components/zk-login/zk-login.types';
import {
  MAX_EPOCH,
  METASCHOOL_ACCOUNT_KEY,
  METASCHOOL_SET_UP_KEY,
} from '@/constants';

export function saveSetupData(data: SetupData) {
  localStorage.setItem(METASCHOOL_SET_UP_KEY, JSON.stringify(data));
}

export function loadSetupData(): SetupData | null {
  const dataRaw = localStorage.getItem(METASCHOOL_SET_UP_KEY);
  if (!dataRaw) {
    return null;
  }
  const data: SetupData = JSON.parse(dataRaw);
  return data;
}

export function clearSetupData(): void {
  localStorage.removeItem(METASCHOOL_SET_UP_KEY);
  localStorage.removeItem(METASCHOOL_ACCOUNT_KEY);
}

export function saveAccount(account: AccountData): void {
  localStorage.setItem(METASCHOOL_ACCOUNT_KEY, JSON.stringify(account));
}

export function loadAccount(): AccountData | null {
  const dataRaw = localStorage.getItem(METASCHOOL_ACCOUNT_KEY);

  if (!dataRaw) return null;

  return JSON.parse(dataRaw);
}

export const beginZKLogin = async (
  suiClient: SuiClient,
  provider: OpenIdProvider
) => {
  toast(`🔑 Logging in with ${provider}...`);

  // Create a nonce
  const { epoch } = await suiClient.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + MAX_EPOCH; // the ephemeral key will be valid for MAX_EPOCH from now
  const randomness = generateRandomness();
  const ephemeralKeyPair = new Ed25519Keypair();
  const nonce = generateNonce(
    ephemeralKeyPair.getPublicKey(),
    maxEpoch,
    randomness
  );

  // Save data to local storage so completeZkLogin() can use it after the redirect
  saveSetupData({
    provider,
    maxEpoch,
    randomness: randomness.toString(),
    ephemeralPublicKey: toBigIntBE(
      Buffer.from(ephemeralKeyPair.getPublicKey().toSuiBytes())
    ).toString(),
    ephemeralPrivateKey: ephemeralKeyPair.export().privateKey,
  });
  // Start the OAuth flow with the OpenID provider
  const urlParamsBase = {
    nonce: nonce,
    redirect_uri: window.location.origin,
    response_type: 'id_token',
    scope: 'openid',
  };
  let loginUrl: string;
  switch (provider) {
    case 'Google': {
      const urlParams = new URLSearchParams({
        ...urlParamsBase,
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID_GOOGLE || '',
      });
      loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${urlParams}`;
      break;
    }
    case 'Twitch': {
      const urlParams = new URLSearchParams({
        ...urlParamsBase,
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID_TWITCH || '',
        force_verify: 'true',
        lang: 'en',
        login_type: 'zk-login',
      });
      loginUrl = `https://id.twitch.tv/oauth2/authorize?${urlParams}`;
      break;
    }
    case 'Facebook': {
      const urlParams = new URLSearchParams({
        ...urlParamsBase,
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID_FACEBOOK || '',
      });
      loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?${urlParams}`;
      break;
    }
  }
  window.location.replace(loginUrl);
};

export const completeZkLogin = async () => {
  // Validate the JWT
  // https://docs.sui.io/build/zk_login#decoding-jwt
  const urlFragment = window.location.hash.substring(1);
  const urlParams = new URLSearchParams(urlFragment);
  const jwt = urlParams.get('id_token');

  if (!jwt) return;

  window.history.replaceState(null, '', window.location.pathname); // remove URL fragment
  const jwtPayload = decodeJwt(jwt);
  if (!jwtPayload.sub || !jwtPayload.aud) {
    console.warn('[completeZkLogin] missing jwt.sub or jwt.aud');
    return;
  }

  // Get a Sui address for the user
  // https://docs.sui.io/build/zk_login#user-salt-management
  // https://docs.sui.io/build/zk_login#get-the-users-sui-address
  const saltResponse: SaltAPIResponse = await fetch('/api/get-salt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jwt }),
  })
    .then((res) => {
      console.debug('[completeZkLogin] salt service success');
      return res.json();
    })
    .catch((error) => {
      console.warn('[completeZkLogin] salt service error:', error);
      return null;
    });
  if (!saltResponse) {
    return;
  }

  const userSalt = BigInt(saltResponse.salt);
  const userAddr = jwtToAddress(jwt, userSalt);

  // Load and clear data from local storage which beginZkLogin() created before the redirect
  const setupData = loadSetupData();
  if (!setupData) {
    console.warn('[completeZkLogin] missing local storage data');
    return;
  }
  clearSetupData();

  // Get the zero-knowledge proof
  // https://docs.sui.io/build/zk_login#get-the-zero-knowledge-proof

  const payload = JSON.stringify(
    {
      maxEpoch: setupData.maxEpoch,
      jwtRandomness: setupData.randomness,
      extendedEphemeralPublicKey: setupData.ephemeralPublicKey,
      jwt,
      salt: userSalt.toString(),
      keyClaimName: 'sub',
    },
    null,
    2
  );

  console.debug('[completeZkLogin] Requesting ZK proof with:', payload);
  toast('⏳ Requesting ZK proof. This can take a few seconds...');

  const zkProofs: PartialZkLoginSignature = await fetch('/api/prover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  })
    .then((res) => {
      console.debug('[completeZkLogin] ZK proving service success');
      return res.json();
    })
    .catch((error) => {
      console.log(error);
      console.warn('[completeZkLogin] ZK proving service error:', error);
      return null;
    });

  if (!zkProofs) {
    return;
  }

  return {
    provider: setupData.provider,
    userAddr,
    zkProofs,
    ephemeralPublicKey: setupData.ephemeralPublicKey,
    ephemeralPrivateKey: setupData.ephemeralPrivateKey,
    userSalt: userSalt.toString(),
    sub: jwtPayload.sub,
    aud:
      typeof jwtPayload.aud === 'string' ? jwtPayload.aud : jwtPayload.aud[0],
    maxEpoch: setupData.maxEpoch,
  };
};
