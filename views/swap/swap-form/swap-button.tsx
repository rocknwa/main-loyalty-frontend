import { Button, ProgressIndicator } from '@interest-protocol/ui-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import BigNumber from 'bignumber.js';
import { path, pathOr, propOr } from 'ramda';
import { FC, useState } from 'react';
import { useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  ACCOUNT_CAP_TYPE,
  DEEP_BOOK_POOL,
  DEX_STORAGE_ID,
  ETH_TYPE,
  LOYALTY_PACKAGE_ID,
  PACKAGE_ID,
  USDC_TYPE,
} from '@/constants';
import { useDeepHook, useSuiClient, useWeb3 } from '@/hooks';
import { FixedPointMath } from '@/lib';
import {
  buildZkLoginTx,
  createObjectsParameter,
  showTXSuccessToast,
  throwTXIfNotSuccessful,
  ZERO_BIG_NUMBER,
  getLoyaltyAccount,
} from '@/utils';

import { SwapFormButtonProps } from './swap-form.types';

const SwapFormButton: FC<SwapFormButtonProps> = ({ formSwap }) => {
  const formValues = useWatch({ control: formSwap.control });
  const { mutate } = useWeb3();

  const { account, coinsMap } = useWeb3();
  const suiClient = useSuiClient();
  const deepBook = useDeepHook();
  const [loading, setLoading] = useState(false);

  const isDisabled =
    !account ||
    !path(['to', 'type'], formValues) ||
    !path(['from', 'type'], formValues) ||
    !+pathOr(0, ['to', 'value'], formValues) ||
    !+pathOr(0, ['from', 'value'], formValues);

  const tokenIn = formSwap.getValues('from');
  const tokenOut = formSwap.getValues('to');

  const resetInput = () => {
    formSwap.setValue('to.value', '0');
    formSwap.setValue('disabled', true);
    formSwap.setValue('from.value', '0');
  };

  const handleSwap = async () => {
    try {
      setLoading(true);

      if (!tokenIn.type || !tokenOut.type) throw new Error('No Tokens');

      if (!account) throw new Error('No account');

      if (!+tokenIn.value) throw new Error('Cannot sell 0 coins');

      const isMaxTrade = formSwap.getValues('maxValue');

      const amount = isMaxTrade
        ? coinsMap[tokenIn.type]?.totalBalance ?? ZERO_BIG_NUMBER
        : FixedPointMath.toBigNumber(
            tokenIn.value,
            tokenIn.decimals
          ).decimalPlaces(0, BigNumber.ROUND_DOWN);

      const amountOut = FixedPointMath.toBigNumber(
        tokenOut.value,
        tokenOut.decimals
      ).decimalPlaces(0, BigNumber.ROUND_DOWN);

      const objects = await suiClient.getOwnedObjects({
        owner: account.userAddr,
        options: {
          showType: true,
        },
      });

      const cap = objects.data.find(
        (obj) => obj.data?.type === ACCOUNT_CAP_TYPE
      );

      const txb = new TransactionBlock();

      const ethCoinInList = createObjectsParameter({
        coinsMap,
        txb,
        type: ETH_TYPE,
        amount: amount.toString(),
      });

      const usdCoinInList = createObjectsParameter({
        coinsMap,
        txb,
        type: USDC_TYPE,
        amount: amount.toString(),
      });

      const isBid = USDC_TYPE.toLowerCase() === tokenIn.type.toLowerCase();

      if (cap?.data?.objectId) {
        const usdCoin = txb.moveCall({
          target: '0x2::coin::zero',
          typeArguments: [USDC_TYPE],
        });

        const ethCoin = txb.moveCall({
          target: '0x2::coin::zero',
          typeArguments: [ETH_TYPE],
        });

        if (isBid) {
          txb.moveCall({
            target: '0x2::pay::join_vec',
            typeArguments: [USDC_TYPE],
            arguments: [
              usdCoin,
              txb.makeMoveVec({
                objects: usdCoinInList,
              }),
            ],
          });
        } else {
          txb.moveCall({
            target: '0x2::pay::join_vec',
            typeArguments: [ETH_TYPE],
            arguments: [
              ethCoin,
              txb.makeMoveVec({
                objects: ethCoinInList,
              }),
            ],
          });
        }

        const loyaltyAccount = await getLoyaltyAccount(
          suiClient,
          account.userAddr
        );

        if (loyaltyAccount) {
          const [resultEth, resultUSDC, resultDEX] = txb.moveCall({
            target: `${LOYALTY_PACKAGE_ID}::loyalty::place_market_order`,
            arguments: [
              txb.object(loyaltyAccount?.objectId || ''),
              txb.object(DEX_STORAGE_ID),
              txb.object(DEEP_BOOK_POOL),
              txb.object(cap.data.objectId),
              txb.pure(isBid ? amountOut.toString() : amount.toString()),
              txb.pure(isBid),
              ethCoin,
              usdCoin,
              txb.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
          txb.transferObjects(
            [resultEth, resultUSDC, resultDEX],
            account.userAddr
          );
        } else {
          const [resultEth, resultUSDC, resultDEX] = txb.moveCall({
            target: `${PACKAGE_ID}::dex::place_market_order`,
            arguments: [
              txb.object(DEX_STORAGE_ID),
              txb.object(DEEP_BOOK_POOL),
              txb.object(cap.data.objectId),
              txb.pure(isBid ? amountOut.toString() : amount.toString()),
              txb.pure(isBid),
              ethCoin,
              usdCoin,
              txb.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
          txb.transferObjects(
            [resultEth, resultUSDC, resultDEX],
            account.userAddr
          );
        }
      } else {
        const usdCoin = txb.moveCall({
          target: '0x2::coin::zero',
          typeArguments: [USDC_TYPE],
        });

        const ethCoin = txb.moveCall({
          target: '0x2::coin::zero',
          typeArguments: [ETH_TYPE],
        });

        if (isBid) {
          txb.moveCall({
            target: '0x2::pay::join_vec',
            typeArguments: [USDC_TYPE],
            arguments: [
              usdCoin,
              txb.makeMoveVec({
                objects: usdCoinInList,
              }),
            ],
          });
        } else {
          txb.moveCall({
            target: '0x2::pay::join_vec',
            typeArguments: [ETH_TYPE],
            arguments: [
              ethCoin,
              txb.makeMoveVec({
                objects: ethCoinInList,
              }),
            ],
          });
        }
        const cap = deepBook.createAccountCap(txb as any);
        const loyaltyAccount = await getLoyaltyAccount(
          suiClient,
          account.userAddr
        );

        if (loyaltyAccount) {
          const [resultEth, resultUSDC, resultDEX] = txb.moveCall({
            target: `${LOYALTY_PACKAGE_ID}::loyalty::place_market_order`,
            arguments: [
              txb.object(loyaltyAccount?.objectId || ''),
              txb.object(DEX_STORAGE_ID),
              txb.object(DEEP_BOOK_POOL),
              cap,
              txb.pure(amount.toString()),
              txb.pure(isBid),
              ethCoin,
              usdCoin,
              txb.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
          txb.transferObjects(
            [cap, resultEth, resultUSDC, resultDEX],
            account.userAddr
          );
        } else {
          const [resultEth, resultUSDC, resultDEX] = txb.moveCall({
            target: `${PACKAGE_ID}::dex::place_market_order`,
            arguments: [
              txb.object(DEX_STORAGE_ID),
              txb.object(DEEP_BOOK_POOL),
              cap,
              txb.pure(amount.toString()),
              txb.pure(isBid),
              ethCoin,
              usdCoin,
              txb.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
          txb.transferObjects(
            [cap, resultEth, resultUSDC, resultDEX],
            account.userAddr
          );
        }
      }

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
      throw new Error('Failed to swap');
    } finally {
      await mutate();
      resetInput();
      setLoading(false);
    }
  };

  const onSwap = async () =>
    await toast.promise(handleSwap(), {
      loading: 'Swapping...',
      success: 'Swap was successful!',
      error: (error) => {
        return propOr('Swap failed', 'message', error);
      },
    });

  return (
    <Button
      mt="s"
      mx="auto"
      size="small"
      variant="filled"
      disabled={isDisabled || loading}
      boxSizing="border-box"
      justifyContent="center"
      width={['100%', '100%', 'auto']}
      onClick={isDisabled ? undefined : onSwap}
      PrefixIcon={
        loading ? <ProgressIndicator variant="loading" size={16} /> : null
      }
    >
      {loading ? 'Swapping...' : 'Swap'}
    </Button>
  );
};

export default SwapFormButton;
