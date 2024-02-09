import { bcs } from '@mysten/sui.js/bcs';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import useSWR from 'swr';

import { DEX_STORAGE_ID, ETH_TYPE, PACKAGE_ID, USDC_TYPE } from '@/constants';
import { makeSWRKey } from '@/utils';
import { getReturnValuesFromInspectResults } from '@/utils';

import { useSuiClient } from '../use-sui-client';
import { useWeb3 } from '../use-web3';

const userLastMintEpochTarget = `${PACKAGE_ID}::dex::user_last_mint_epoch`;
const userSwapCountTarget = `${PACKAGE_ID}::dex::user_swap_count`;

const getLastMintEpoch = async (
  suiClient: SuiClient,
  coinType: string,
  account: string
) => {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: userLastMintEpochTarget,
    typeArguments: [coinType],
    arguments: [txb.object(DEX_STORAGE_ID), txb.pure(account)],
  });

  const response = await suiClient.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: account,
  });

  if (response.effects.status.status === 'failure') return '0';

  const data = getReturnValuesFromInspectResults(response);

  if (!data || !data.length) return '0';

  const result = data[0];

  return bcs.de(result[1], Uint8Array.from(result[0])) as string;
};

const getUserSwapCount = async (suiClient: SuiClient, account: string) => {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: userSwapCountTarget,
    arguments: [txb.object(DEX_STORAGE_ID), txb.pure(account)],
  });

  const response = await suiClient.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: account,
  });

  if (response.effects.status.status === 'failure') return '0';

  const data = getReturnValuesFromInspectResults(response);

  if (!data || !data.length) return '0';

  const result = data[0];

  return bcs.de(result[1], Uint8Array.from(result[0])) as string;
};

export const useDexUserInfo = () => {
  const { account } = useWeb3();
  const suiClient = useSuiClient();

  const { data } = useSWR(
    makeSWRKey(
      [account?.userAddr, userSwapCountTarget, userLastMintEpochTarget],
      ''
    ),
    async () => {
      if (!account)
        return {
          swapCount: '0',
          lastETHEpoch: '0',
          lastUSDCEpoch: '0',
        };

      const [ethLastMintResponse, usdcLastMintEpoch, swapCountResponse] =
        await Promise.all([
          getLastMintEpoch(suiClient, ETH_TYPE, account.userAddr),
          getLastMintEpoch(suiClient, USDC_TYPE, account.userAddr),
          getUserSwapCount(suiClient, account.userAddr),
        ]);

      return {
        swapCount: swapCountResponse,
        lastETHEpoch: ethLastMintResponse,
        lastUSDCEpoch: usdcLastMintEpoch,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      refreshWhenHidden: false,
      refreshInterval: 10000,
    }
  );

  return data
    ? data
    : {
        swapCount: '0',
        lastETHEpoch: '0',
        lastUSDCEpoch: '0',
      };
};
