import { useState } from 'react';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { Box, Typography } from '@interest-protocol/ui-kit';

import { SEO } from '@/components';
import { ETH_TYPE, USDC_TYPE } from '@/constants';
import Swap from '@/views/swap';
import Stake from '@/views/stake';
import { SwapForm } from '@/views/swap/swap.types';

const Web3Manager = dynamic(() => import('@/components/web3-manager'), {
  ssr: false,
});

const SwapPage: NextPage = () => {
  const formSwap = useForm<SwapForm>({
    defaultValues: {
      from: {
        type: ETH_TYPE,
        decimals: 9,
        symbol: 'ETH',
        value: '0',
      },
      to: {
        type: USDC_TYPE,
        decimals: 9,
        symbol: 'USDC',
        value: '0',
      },
    },
  });

  const formStake = useForm({
    defaultValues: {
      amount: {
        decimals: 9,
        symbol: 'DEX',
        value: '0',
      },
    },
  });

  const dapps = [
    {
      name: 'Swapping dApp',
      key: 'swap',
      component: <Swap formSwap={formSwap} />,
    },
    {
      name: 'Loyalty dApp',
      key: 'stake',
      component: <Stake formStake={formStake} />,
    },
  ];

  const [currentDapp, setCurrentDapp] = useState(dapps[0]);

  return (
    <Web3Manager>
      <SEO />
      <Box
        bg="surface"
        minHeight="100vh"
        minWidth="100vw"
        padding="0px 0px 20px 0px"
      >
        <Box
          display="flex"
          flexDirection="row"
          gap="30px"
          padding="20px"
          position="absolute"
        >
          {dapps.map((dapp, index) => (
            <Box
              key={index}
              display="flex"
              height="fit-content"
              onClick={() => setCurrentDapp(dapp)}
            >
              <Typography
                variant="small"
                fontSize="1rem"
                color="onSurface"
                cursor="pointer"
                textDecoration={`${
                  currentDapp.key === dapp.key ? `underline` : `none`
                }`}
                fontWeight={`${currentDapp.key === dapp.key ? `700` : `500`}`}
              >
                {dapp.name}
              </Typography>
            </Box>
          ))}
        </Box>
        {currentDapp.component}
      </Box>
    </Web3Manager>
  );
};

export default SwapPage;
