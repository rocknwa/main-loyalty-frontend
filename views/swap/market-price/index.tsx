import { Box, Button } from '@interest-protocol/ui-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { propOr } from 'ramda';
import { FC } from 'react';
import { toast } from 'react-hot-toast';
import useSWR from 'swr';
import { v4 } from 'uuid';

import { DEEP_BOOK_POOL, DEX_STORAGE_ID, PACKAGE_ID } from '@/constants';
import { useDeepHook, useSuiClient, useWeb3 } from '@/hooks';
import { FixedPointMath } from '@/lib';
import { makeSWRKey } from '@/utils';
import {
  buildZkLoginTx,
  showTXSuccessToast,
  throwTXIfNotSuccessful,
} from '@/utils';

const MarketPrice: FC = () => {
  const deepBook = useDeepHook();
  const { account } = useWeb3();
  const { data } = useSWR(
    makeSWRKey([DEEP_BOOK_POOL], deepBook.getMarketPrice.name),
    async () => deepBook.getMarketPrice(DEEP_BOOK_POOL),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      refreshWhenHidden: false,
      refreshInterval: 10000,
    }
  );

  const suiClient = useSuiClient();

  const refillPool = async () => {
    if (!account) throw new Error('Not account found');

    const transactionBlock = new TransactionBlock();

    transactionBlock.moveCall({
      target: `${PACKAGE_ID}::dex::fill_pool`,
      arguments: [
        transactionBlock.object(DEX_STORAGE_ID),
        transactionBlock.object(DEEP_BOOK_POOL),
        transactionBlock.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

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
  };

  const onRefill = () =>
    toast.promise(refillPool(), {
      loading: 'Refilling...',
      success: 'Success!',
      error: (error) => {
        return propOr(
          'Something went wrong on rilling the pool',
          'message',
          error
        );
      },
    });

  return (
    <Box
      gap="2xs"
      width="25rem"
      display="flex"
      borderRadius="m"
      overflow="hidden"
      flexDirection="column"
    >
      <Box
        p="m"
        display="flex"
        alignItems="center"
        bg="surface.container"
        justifyContent="space-between"
      >
        <Box>Market Price</Box>
        <Button
          px="s"
          py="xs"
          size="small"
          fontSize="small"
          variant="outline"
          onClick={onRefill}
          disabled={!!data?.bestBidPrice && !!data?.bestAskPrice}
        >
          Refill
        </Button>
      </Box>
      <Box
        p="m"
        gap="m"
        key={v4()}
        fontSize="s"
        display="grid"
        textAlign="center"
        bg="surface.lowestContainer"
        gridTemplateColumns="1fr 1fr 1fr"
      >
        <Box>ETH</Box>
        <Box>ASK</Box>
        <Box>
          {FixedPointMath.from(data?.bestAskPrice || '0').toNumber()} USDC
        </Box>
        <Box>ETH</Box>
        <Box>BID</Box>
        <Box>
          {FixedPointMath.from(data?.bestBidPrice || '0').toNumber()} USDC
        </Box>
      </Box>
    </Box>
  );
};

export default MarketPrice;
