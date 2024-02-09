import { Button } from '@interest-protocol/ui-kit';
import { getFaucetHost, requestSuiFromFaucetV1 } from '@mysten/sui.js/faucet';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { propOr } from 'ramda';
import { FC } from 'react';
import toast from 'react-hot-toast';

import { DEX_STORAGE_ID, ETH_TYPE, PACKAGE_ID, USDC_TYPE } from '@/constants';
import { useSuiClient, useSuiSystemState, useWeb3 } from '@/hooks';
import {
  buildZkLoginTx,
  showTXSuccessToast,
  throwTXIfNotSuccessful,
} from '@/utils';

import { MintButtonsProps } from './faucet.types';

const MintButtons: FC<MintButtonsProps> = ({ lastUSDCEpoch, lastETHEpoch }) => {
  const { account, mutate } = useWeb3();
  const suiClient = useSuiClient();
  const suiSystemState = useSuiSystemState();

  const currentEpoch = BigInt(suiSystemState.data?.epoch || '0');

  const handleOnMint = async (type: string) => {
    try {
      if (!type) throw new Error('Token not found');
      if (!account) throw new Error('Not account found');

      const transactionBlock = new TransactionBlock();

      const minted_coin = transactionBlock.moveCall({
        target: `${PACKAGE_ID}::dex::mint_coin`,
        typeArguments: [type],
        arguments: [transactionBlock.object(DEX_STORAGE_ID)],
      });

      transactionBlock.transferObjects([minted_coin], account.userAddr);

      const { bytes, signature } = await buildZkLoginTx({
        suiClient,
        transactionBlock,
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
    } finally {
      await mutate();
    }
  };

  const onMint = (type: string) =>
    toast.promise(handleOnMint(type), {
      loading: 'Minting...',
      success: 'Token minted successfully!',
      error: (error) => {
        return propOr('Something went wrong on mint token', 'message', error);
      },
    });

  const handleOnFaucetSUI = async () => {
    if (account) {
      await requestSuiFromFaucetV1({
        host: getFaucetHost('testnet'),
        recipient: account.userAddr,
      });
      await mutate();
    }
  };

  const onFaucetSUI = async () =>
    await toast.promise(handleOnFaucetSUI(), {
      loading: 'Minting SUI',
      success: 'SUI minted successfully!',
      error: (error) => {
        return propOr('Something went wrong on mint SUI', 'message', error);
      },
    });

  if (!account) return null;

  return (
    <>
      <Button
        size="small"
        variant="filled"
        onClick={() => onMint(ETH_TYPE)}
        disabled={BigInt(lastETHEpoch) >= currentEpoch}
        opacity={BigInt(lastETHEpoch) >= currentEpoch ? 0.6 : 1}
      >
        Mint ETH
      </Button>
      <Button
        size="small"
        variant="filled"
        onClick={() => onMint(USDC_TYPE)}
        disabled={BigInt(lastUSDCEpoch) >= currentEpoch}
        opacity={BigInt(lastUSDCEpoch) >= currentEpoch ? 0.6 : 1}
      >
        Mint USDC
      </Button>
      <Button size="small" variant="filled" onClick={onFaucetSUI}>
        Mint SUI
      </Button>
    </>
  );
};
export default MintButtons;
