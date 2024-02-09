import { Box, InfoCard, Typography } from '@interest-protocol/ui-kit';
import { SUI_TYPE_ARG } from '@mysten/sui.js/utils';
import { FC } from 'react';
import { v4 } from 'uuid';

import ZKLogin from '@/components/zk-login';
import {
  COIN_TYPE_TO_SYMBOL,
  DEX_COIN_TYPE,
  ETH_TYPE,
  USDC_TYPE,
} from '@/constants';
import { useWeb3 } from '@/hooks';
import { useDexUserInfo } from '@/hooks/use-dex-user-info';
import { FixedPointMath } from '@/lib';
import { ZERO_BIG_NUMBER } from '@/utils';

import DropdownMenu from '../dropdown';
import MintButtons from './faucet';
import MarketPrice from './market-price';
import { SwapProps } from './swap.types';
import SwapForm from './swap-form';

const Swap: FC<SwapProps> = (props) => {
  const { coinsMap, account } = useWeb3();

  const userInfo = useDexUserInfo();

  return (
    <Box
      m="0"
      display="flex"
      alignItems="center"
      justifyItems="unset"
      flexDirection="column"
      justifyContent={['space-between', 'space-between', 'unset']}
    >
      <Box
        p="l"
        gap="l"
        width="100%"
        justifyContent="flex-end"
        display={['none ', 'none ', 'flex']}
      >
        <MintButtons
          lastETHEpoch={userInfo.lastETHEpoch}
          lastUSDCEpoch={userInfo.lastUSDCEpoch}
        />
        <ZKLogin />
      </Box>
      <DropdownMenu />
      {account ? (
        <Box display="flex" gap="m" mt="2xl" flexWrap="wrap" p="l">
          <InfoCard
            width="10rem"
            info="DEX Swaps"
            title={
              <Typography variant="medium" fontSize="2rem">
                ⇋
              </Typography>
            }
          >
            {userInfo?.swapCount || '0'}
          </InfoCard>
          {[ETH_TYPE, USDC_TYPE, DEX_COIN_TYPE].map((type) => (
            <InfoCard
              key={v4()}
              width="10rem"
              info="Balance"
              title={
                <Typography variant="medium">
                  {COIN_TYPE_TO_SYMBOL[type]}
                </Typography>
              }
            >
              {FixedPointMath.from(
                coinsMap[type]?.totalBalance ?? ZERO_BIG_NUMBER
              ).toNumber()}
            </InfoCard>
          ))}
          <InfoCard
            width="10rem"
            info="Balance"
            title={<Typography variant="medium">SUI</Typography>}
          >
            {FixedPointMath.from(
              coinsMap[SUI_TYPE_ARG]?.totalBalance ?? ZERO_BIG_NUMBER
            ).toNumber()}
          </InfoCard>
        </Box>
      ) : null}
      <Typography
        mt="xl"
        pt="xl"
        color="onSurface"
        textAlign="center"
        variant="displayLarge"
      >
        SWAP
      </Typography>
      <Box
        gap="4xl"
        display="flex"
        color="onSurface"
        alignItems="flex-start"
        flexDirection={['column', 'column', 'row']}
      >
        <SwapForm {...props} />
        <MarketPrice />
      </Box>
    </Box>
  );
};

export default Swap;
