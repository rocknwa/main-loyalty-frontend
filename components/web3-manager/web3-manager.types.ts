import { CoinStruct, PaginatedCoins, SuiClient } from '@mysten/sui.js/client';
import BigNumber from 'bignumber.js';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { KeyedMutator } from 'swr';

import { AccountData } from '@/components/zk-login/zk-login.types';
import { LocalTokenMetadataRecord } from '@/interface';

export interface Web3ManagerSuiObject {
  type: string;
  symbol: string;
  totalBalance: BigNumber;
  objects: ReadonlyArray<CoinStruct>;
  decimals: number;
}

export interface Web3ManagerState {
  account: null | AccountData;
  address: string | null;
  coins: ReadonlyArray<Web3ManagerSuiObject>;
  coinsMap: Record<string, Web3ManagerSuiObject>;
  connected: boolean;
  error: boolean;
  mutate: KeyedMutator<PaginatedCoins['data'] | undefined>;
  isFetchingCoinBalances: boolean;
  setAccount: Dispatch<SetStateAction<AccountData | null>>;
  setIsLoggingIn: Dispatch<SetStateAction<boolean>>;
  isLoggingIn: boolean;
}

export interface Web3ManagerProps {
  children: ReactNode;
}

export type CoinsMap = Web3ManagerState['coinsMap'];

export interface ParseCoinsArgs {
  data: PaginatedCoins['data'] | undefined | never[];
  localTokens: LocalTokenMetadataRecord;
}

export interface GetAllCoinsArgs {
  suiClient: SuiClient;
  account: string;
}

export interface GetAllCoinsInternalArgs extends GetAllCoinsArgs {
  data: PaginatedCoins['data'];
  cursor?: null | string;
  hasNextPage: boolean;
}
