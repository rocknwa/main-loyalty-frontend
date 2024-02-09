import { Button, ProgressIndicator, Box } from '@interest-protocol/ui-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getLoyaltyAccount } from '@/utils';
import { propOr } from 'ramda';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LOYALTY_PACKAGE_ID, DEX_COIN_TYPE } from '@/constants';
import { useSuiClient, useWeb3 } from '@/hooks';
import { FixedPointMath } from '@/lib';
import {
  buildZkLoginTx,
  createObjectsParameter,
  showTXSuccessToast,
  throwTXIfNotSuccessful,
  ZERO_BIG_NUMBER,
} from '@/utils';
import { useLoyaltyUserInfo } from '@/hooks/use-loyalty-user-info';

const StakeFormButtons = ({ formStake }) => {
  const formValues = useWatch({ control: formStake.control });
  const { mutate } = useWeb3();
  const userInfo = useLoyaltyUserInfo();

  const { account, coinsMap } = useWeb3();

  const balance = FixedPointMath.from(
    coinsMap[DEX_COIN_TYPE]?.totalBalance ?? ZERO_BIG_NUMBER
  ).toNumber();

  const stakedAmount = FixedPointMath.from(
    userInfo?.stakedAmount ?? ZERO_BIG_NUMBER
  ).toNumber();

  const isStakeBtnDisabled = !balance;

  const isUnstakeBtnDisabled = !stakedAmount;

  const isRewardBtnDisabled = parseFloat(userInfo.rewardPoints) < 5;

  const suiClient = useSuiClient();

  const [loading, setLoading] = useState('');

  const createLoyaltyAccount = async () => {
    try {
      setLoading('Creating Loyalty Account');
      const txb = new TransactionBlock();

      const loyalty_account_address = txb.moveCall({
        target: `${LOYALTY_PACKAGE_ID}::loyalty::create_account`,
      });

      txb.transferObjects([loyalty_account_address], account.userAddr);

      const { bytes, signature } = await buildZkLoginTx({
        suiClient,
        transactionBlock: txb,
        account,
      });

      const tx = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
        },
      });

      throwTXIfNotSuccessful(tx);

      await showTXSuccessToast(tx);
    } catch (e) {
      console.log('error', e);
      throw new Error('Failed to create account');
    } finally {
      await mutate();
      setLoading('');
    }
  };

  const handleStake = async (loyaltyAccount) => {
    try {
      setLoading('Staking');

      const txb = new TransactionBlock();

      const dexCoin = txb.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [DEX_COIN_TYPE],
      });

      const dexCoinInList = createObjectsParameter({
        coinsMap,
        txb,
        type: DEX_COIN_TYPE,
        amount: 1,
      });

      txb.moveCall({
        target: '0x2::pay::join_vec',
        typeArguments: [DEX_COIN_TYPE],
        arguments: [
          dexCoin,
          txb.makeMoveVec({
            objects: dexCoinInList,
          }),
        ],
      });

      txb.moveCall({
        target: `${LOYALTY_PACKAGE_ID}::loyalty::stake`,
        arguments: [txb.object(loyaltyAccount?.objectId), dexCoin],
      });

      const { bytes, signature } = await buildZkLoginTx({
        suiClient,
        transactionBlock: txb,
        account,
      });

      const tx = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
        },
      });

      throwTXIfNotSuccessful(tx);

      await showTXSuccessToast(tx);
    } catch (e) {
      console.log('error', e);
      throw new Error('Failed to stake');
    } finally {
      await mutate();
      setLoading('');
    }
  };

  const handleUnstake = async (loyaltyAccount) => {
    try {
      setLoading('Unstaking');
      const txb = new TransactionBlock();
      const unstaked_amount = txb.moveCall({
        target: `${LOYALTY_PACKAGE_ID}::loyalty::unstake`,
        arguments: [txb.object(loyaltyAccount?.objectId)],
      });

      txb.transferObjects([unstaked_amount], account.userAddr);

      const { bytes, signature } = await buildZkLoginTx({
        suiClient,
        transactionBlock: txb,
        account,
      });

      const tx = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
        },
      });

      throwTXIfNotSuccessful(tx);

      await showTXSuccessToast(tx);
    } catch (e) {
      console.log('error', e);
      throw new Error('Failed to unstake');
    } finally {
      await mutate();
      setLoading('');
    }
  };

  const handleGetReward = async (loyaltyAccount) => {
    try {
      setLoading('Getting Reward');
      const txb = new TransactionBlock();
      const reward = txb.moveCall({
        target: `${LOYALTY_PACKAGE_ID}::loyalty::get_reward`,
        arguments: [txb.object(loyaltyAccount?.objectId)],
      });

      txb.transferObjects([reward], account.userAddr);

      const { bytes, signature } = await buildZkLoginTx({
        suiClient,
        transactionBlock: txb,
        account,
      });

      const tx = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
        },
      });

      throwTXIfNotSuccessful(tx);

      await showTXSuccessToast(tx);
    } catch (e) {
      console.log('error', e);
      throw new Error('Failed to get reward');
    } finally {
      await mutate();
      setLoading('');
    }
  };

  const onStake = async () => {
    let loyaltyAccount = await getLoyaltyAccount(suiClient, account.userAddr);
    if (!loyaltyAccount) {
      await toast.promise(createLoyaltyAccount(), {
        loading: 'Creating Loyalty Account',
        success: 'Account Created Successfully!',
        error: (error) => {
          return propOr('Loyalty Account Creation Failed', 'message', error);
        },
      });
      loyaltyAccount = await getLoyaltyAccount(suiClient, account.userAddr);
    }
    await toast.promise(handleStake(loyaltyAccount), {
      loading: 'Staking...',
      success: 'Amount Staked Successfully!',
      error: (error) => {
        return propOr('Staking Failed', 'message', error);
      },
    });
  };

  const onUnstake = async () => {
    const loyaltyAccount = await getLoyaltyAccount(suiClient, account.userAddr);
    await toast.promise(handleUnstake(loyaltyAccount), {
      loading: 'Unstaking...',
      success: 'Amount Unstaked Successfully!',
      error: (error) => {
        return propOr('Unstaking Failed', 'message', error);
      },
    });
  };

  const onGetReward = async () => {
    const loyaltyAccount = await getLoyaltyAccount(suiClient, account.userAddr);
    await toast.promise(handleGetReward(loyaltyAccount), {
      loading: 'Getting NFT Reward...',
      success: 'NFT Reward Received Successfully!',
      error: (error) => {
        return propOr('Reward Receival Failed', 'message', error);
      },
    });
  };

  const StakeButton = () => (
    <Button
      mt="s"
      mx="auto"
      size="small"
      variant="filled"
      disabled={!!loading || isStakeBtnDisabled}
      boxSizing="border-box"
      justifyContent="center"
      width={['100%', '100%', 'auto']}
      onClick={isStakeBtnDisabled ? undefined : onStake}
      PrefixIcon={
        ['Staking', 'Creating Loyalty Account'].includes(loading) ? (
          <ProgressIndicator variant="loading" size={16} />
        ) : null
      }
    >
      {['Staking', 'Creating Loyalty Account'].includes(loading)
        ? loading
        : 'Stake'}
    </Button>
  );

  const UnstakeButton = () => (
    <Button
      mt="s"
      mx="auto"
      size="small"
      variant="filled"
      disabled={!!loading || isUnstakeBtnDisabled}
      boxSizing="border-box"
      justifyContent="center"
      width={['100%', '100%', 'auto']}
      onClick={isUnstakeBtnDisabled ? undefined : onUnstake}
      PrefixIcon={
        loading === 'Unstaking' ? (
          <ProgressIndicator variant="loading" size={16} />
        ) : null
      }
    >
      {loading === 'Unstaking' ? loading : 'Unstake'}
    </Button>
  );

  const NFTRewardButton = () => (
    <Button
      mt="s"
      mx="auto"
      size="small"
      variant="filled"
      disabled={!!loading || isRewardBtnDisabled}
      boxSizing="border-box"
      justifyContent="center"
      width={['100%', '100%', 'auto']}
      onClick={isRewardBtnDisabled ? undefined : onGetReward}
      PrefixIcon={
        loading === 'Getting Reward' ? (
          <ProgressIndicator variant="loading" size={16} />
        ) : null
      }
    >
      {loading === 'Getting Reward'
        ? loading
        : isRewardBtnDisabled
        ? 'Ineligible For Reward'
        : 'Get Reward'}
    </Button>
  );

  return (
    <Box display="flex" flexDirection="row" gap="40px">
      {StakeButton()}
      {UnstakeButton()}
      {NFTRewardButton()}
    </Box>
  );
};

export default StakeFormButtons;
