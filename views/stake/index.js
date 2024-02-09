import { Box, InfoCard, Typography } from '@interest-protocol/ui-kit';
import { v4 } from 'uuid';

import ZKLogin from '@/components/zk-login';
import { COIN_TYPE_TO_SYMBOL, DEX_COIN_TYPE } from '@/constants';
import { useWeb3 } from '@/hooks';
import { useLoyaltyUserInfo } from '@/hooks/use-loyalty-user-info';
import { FixedPointMath } from '@/lib';
import { ZERO_BIG_NUMBER } from '@/utils';

import DropdownMenu from '../dropdown';
import StakeForm from './stake-form';

const Stake = (props) => {
  const { coinsMap, account } = useWeb3();
  const userInfo = useLoyaltyUserInfo();

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
        <ZKLogin />
      </Box>
      <DropdownMenu />
      {account ? (
        <Box display="flex" flexDirection="row">
          <Box display="flex" gap="m" mt="2xl" flexWrap="wrap" p="l">
            <InfoCard
              key={v4()}
              width="10rem"
              info="Balance"
              title={
                <Typography variant="medium">
                  {COIN_TYPE_TO_SYMBOL[DEX_COIN_TYPE]}
                </Typography>
              }
            >
              {FixedPointMath.from(
                coinsMap[DEX_COIN_TYPE]?.totalBalance ?? ZERO_BIG_NUMBER
              ).toNumber()}
            </InfoCard>
          </Box>
          <Box display="flex" gap="m" mt="2xl" flexWrap="wrap" p="l">
            <InfoCard
              key={v4()}
              width="10rem"
              info="Staked"
              title={
                <Typography variant="medium">
                  {COIN_TYPE_TO_SYMBOL[DEX_COIN_TYPE]}
                </Typography>
              }
            >
              {FixedPointMath.from(userInfo.stakedAmount).toNumber()}
            </InfoCard>
          </Box>
          <Box display="flex" gap="m" mt="2xl" flexWrap="wrap" p="l">
            <InfoCard
              key={v4()}
              width="10rem"
              info="Points"
              title={<Typography variant="medium">Reward</Typography>}
            >
              {userInfo.rewardPoints}
            </InfoCard>
          </Box>
        </Box>
      ) : null}
      <Typography
        mt="xl"
        pt="xl"
        color="onSurface"
        textAlign="center"
        variant="displayLarge"
      >
        Loyalty Program
      </Typography>
      <Box
        gap="4xl"
        display="flex"
        color="onSurface"
        alignItems="flex-start"
        flexDirection={['column', 'column', 'row']}
        marginTop="20px"
      >
        <StakeForm {...props} />
      </Box>
    </Box>
  );
};

export default Stake;
