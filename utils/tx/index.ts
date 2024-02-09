import {
  DevInspectResults,
  SuiClient,
  SuiTransactionBlockResponse,
} from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SerializedSignature } from '@mysten/sui.js/src/cryptography';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { genAddressSeed, getZkLoginSignature } from '@mysten/zklogin';
import { head, propOr } from 'ramda';

import { AccountData } from '@/components/zk-login/zk-login.types';

export const throwTXIfNotSuccessful = (tx: SuiTransactionBlockResponse) => {
  if (!!tx.effects?.status && tx.effects.status.status !== 'success')
    throw new Error();
};

interface BuildZkLoginTxArgs {
  suiClient: SuiClient;
  transactionBlock: TransactionBlock;
  account: AccountData;
}

export const buildZkLoginTx = async ({
  suiClient,
  transactionBlock,
  account,
}: BuildZkLoginTxArgs) => {
  transactionBlock.setSender(account.userAddr);
  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
    Buffer.from(account.ephemeralPrivateKey, 'base64')
  );

  const { bytes, signature: userSignature } = await transactionBlock.sign({
    client: suiClient,
    signer: ephemeralKeyPair,
  });

  const addressSeed = genAddressSeed(
    BigInt(account.userSalt),
    'sub',
    account.sub,
    account.aud
  ).toString();

  const zkLoginSignature: SerializedSignature = getZkLoginSignature({
    inputs: {
      ...account.zkProofs,
      addressSeed,
    },
    maxEpoch: account.maxEpoch,
    userSignature,
  });

  return {
    bytes,
    signature: zkLoginSignature,
  };
};

export const getReturnValuesFromInspectResults = (
  x: DevInspectResults
): Array<[number[], string]> | null => {
  const results = propOr([], 'results', x) as DevInspectResults['results'];

  if (!results?.length) return null;

  const firstElem = head(results);

  if (!firstElem) return null;

  const returnValues = firstElem?.returnValues;

  return returnValues ? returnValues : null;
};
