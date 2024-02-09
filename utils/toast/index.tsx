import { Box, Typography } from '@interest-protocol/ui-kit';
import { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import toast from 'react-hot-toast';

import { Network } from '@/constants';
import { EXPLORER_URL } from '@/constants';

export const showTXSuccessToast = async (
  tx: SuiTransactionBlockResponse
): Promise<void> => {
  const explorerLink = `${EXPLORER_URL[Network.TESTNET]}/txblock/${tx.digest}`;

  toast(
    <a target="__black" rel="noreferrer nofollow" href={explorerLink}>
      <Box display="flex" alignItems="center">
        <Typography
          variant="medium"
          color="accent"
          textDecoration="underline"
          fontWeight="700"
          cursor="pointer"
        >
          Sui Explorer
        </Typography>
      </Box>
    </a>
  );
};
