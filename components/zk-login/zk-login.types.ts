import { getZkLoginSignature } from '@mysten/sui.js/src/zklogin';

export type OpenIdProvider = 'Google' | 'Facebook' | 'Twitch';

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>['0']['inputs'],
  'addressSeed'
>;

export interface SetupData {
  provider: OpenIdProvider;
  maxEpoch: number;
  randomness: string;
  ephemeralPublicKey: string;
  ephemeralPrivateKey: string;
}

export interface AccountData {
  provider: OpenIdProvider;
  userAddr: string;
  zkProofs: PartialZkLoginSignature;
  ephemeralPublicKey: string;
  ephemeralPrivateKey: string;
  userSalt: string;
  sub: string;
  aud: string;
  maxEpoch: number;
}

export interface SaltAPIResponse {
  salt: string;
}
