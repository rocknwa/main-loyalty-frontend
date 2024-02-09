import BigNumber from 'bignumber.js';

export type BigNumberish = BigNumber | bigint | string | number;

export interface CoinData {
  type: string;
  decimals: number;
  symbol: string;
}

export type LocalTokenMetadataRecord = Record<string, CoinData>;
