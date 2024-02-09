import { CoinStruct, PaginatedCoins } from '@mysten/sui.js/client';
import { pathOr } from 'ramda';

import { COIN_DECIMALS, COIN_TYPE_TO_SYMBOL } from '@/constants';
import { normalizeSuiType, parseBigNumberish, safeSymbol } from '@/utils';

import {
  GetAllCoinsArgs,
  GetAllCoinsInternalArgs,
  ParseCoinsArgs,
  Web3ManagerSuiObject,
} from './web3-manager.types';

export const parseCoins = ({ data, localTokens }: ParseCoinsArgs) => {
  if (!data || !data.length)
    return [[], {}] as [
      ReadonlyArray<Web3ManagerSuiObject>,
      Record<string, Web3ManagerSuiObject>,
    ];

  return (data as CoinStruct[]).reduce(
    (acc, object) => {
      const type = normalizeSuiType(object.coinType);

      const list = acc[0];
      const map = acc[1];
      const currentCoinBalance = parseBigNumberish(object.balance);
      if (type) {
        const currentCoin = map[type];

        if (currentCoin) {
          const updatedMap = {
            ...map,
            [type]: {
              ...currentCoin,
              totalBalance: currentCoin.totalBalance.plus(currentCoinBalance),
              objects: [...currentCoin.objects, object],
            },
          };

          const updatedList = list.map((elem) => {
            if (elem.type === type) {
              return {
                ...elem,
                totalBalance: elem.totalBalance.plus(currentCoinBalance),
                objects: [...elem.objects, object],
              };
            }
            return elem;
          });

          return [updatedList, updatedMap] as [
            ReadonlyArray<Web3ManagerSuiObject>,
            Record<string, Web3ManagerSuiObject>,
          ];
        }

        const symbol =
          pathOr(null, [type], COIN_TYPE_TO_SYMBOL) ??
          pathOr(null, [type, 'symbol'], localTokens) ??
          safeSymbol(type, type);

        const decimals =
          pathOr(null, [type], COIN_DECIMALS) ??
          pathOr(-1, [type, 'decimals'], localTokens);

        const symbolArray = symbol.trim().split(' ');

        const updatedMap = {
          ...map,
          [type]: {
            type,
            symbol: symbolArray[symbolArray.length - 1],
            decimals,
            totalBalance: currentCoinBalance,
            objects: [object],
          },
        };

        const updatedList = [
          ...list,
          {
            type,
            symbol: symbolArray[symbolArray.length - 1],
            decimals,
            totalBalance: currentCoinBalance,
            objects: [object],
          },
        ];

        return [updatedList, updatedMap] as [
          ReadonlyArray<Web3ManagerSuiObject>,
          Record<string, Web3ManagerSuiObject>,
        ];
      }

      return acc;
    },
    [[], {}] as [
      ReadonlyArray<Web3ManagerSuiObject>,
      Record<string, Web3ManagerSuiObject>,
    ]
  );
};

const getAllCoinsInternal = async ({
  data,
  account,
  cursor,
  hasNextPage,
  suiClient,
}: GetAllCoinsInternalArgs): Promise<PaginatedCoins['data']> => {
  if (!hasNextPage) return data;

  const payload = await suiClient.getAllCoins({ owner: account, cursor });

  return await getAllCoinsInternal({
    suiClient,
    account,
    cursor: payload.nextCursor,
    hasNextPage: payload.hasNextPage,
    data: data.concat(payload.data),
  });
};

export const getAllCoins = async ({ suiClient, account }: GetAllCoinsArgs) => {
  const payload = await suiClient.getAllCoins({ owner: account });

  return getAllCoinsInternal({
    suiClient,
    account,
    cursor: payload.nextCursor,
    data: payload.data,
    hasNextPage: payload.hasNextPage,
  });
};
