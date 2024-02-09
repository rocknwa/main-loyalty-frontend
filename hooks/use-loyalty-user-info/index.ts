import { bcs } from '@mysten/sui.js/bcs';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import useSWR from 'swr';
import { getLoyaltyAccount } from '@/utils';

import { LOYALTY_PACKAGE_ID } from '@/constants';
import { makeSWRKey } from '@/utils';
import { getReturnValuesFromInspectResults } from '@/utils';

import { useSuiClient } from '../use-sui-client';
import { useWeb3 } from '../use-web3';

const userStakedAmountTarget = `${LOYALTY_PACKAGE_ID}::loyalty::loyalty_account_stake`;
const userRewardPointsTarget = `${LOYALTY_PACKAGE_ID}::loyalty::loyalty_account_points`;

const getUserStakedAmount = async (
  suiClient: SuiClient,
  account: string,
  loyaltyAccount: any
) => {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: userStakedAmountTarget,
    arguments: [txb.object(loyaltyAccount?.objectId)],
  });

  const response = await suiClient.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: account,
  });

  if (response.effects.status.status === 'failure') return '0';

  const data = getReturnValuesFromInspectResults(response);

  if (!data || !data.length) return '0';

  const result = data[0];

  return bcs.de(result[1], Uint8Array.from(result[0]));
};

const getUserRewardPoints = async (
  suiClient: SuiClient,
  account: string,
  loyaltyAccount: any
) => {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: userRewardPointsTarget,
    arguments: [txb.object(loyaltyAccount?.objectId)],
  });

  const response = await suiClient.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: account,
  });

  if (response.effects.status.status === 'failure') return '0';

  const data = getReturnValuesFromInspectResults(response);

  if (!data || !data.length) return '0';

  const result = data[0];

  return bcs.de(result[1], Uint8Array.from(result[0]));
};

export const useLoyaltyUserInfo = () => {
  const { account } = useWeb3();
  const suiClient = useSuiClient();

  const { data } = useSWR(
    makeSWRKey(
      [account?.userAddr, userStakedAmountTarget, userRewardPointsTarget],
      ''
    ),
    async () => {
      if (!account)
        return {
          stakedAmount: null,
          rewardPoints: null,
        };

      const loyaltyAccount = await getLoyaltyAccount(
        suiClient,
        account.userAddr
      );

      if (loyaltyAccount) {
        const [stakedAmountResponse, rewardPointsResponse] = await Promise.all([
          getUserStakedAmount(suiClient, account.userAddr, loyaltyAccount),
          getUserRewardPoints(suiClient, account.userAddr, loyaltyAccount),
        ]);

        return {
          stakedAmount: stakedAmountResponse,
          rewardPoints: rewardPointsResponse,
        };
      }
      return null;
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
        stakedAmount: '0',
        rewardPoints: '0',
      };
};
