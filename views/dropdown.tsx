import { Box } from '@interest-protocol/ui-kit';
import { FC, useState } from 'react';

import ZKLogin from '@/components/zk-login';
import { useDexUserInfo } from '@/hooks/use-dex-user-info';
import { HamburgerSVG } from '@/svg';

import MintButtons from './swap/faucet';

const DropdownMenu: FC = () => {
  const [isOpen, setOpen] = useState(false);

  const userInfo = useDexUserInfo();

  return (
    <Box position="relative" display={['block', 'block', 'none']} width="100%">
      <Box
        p="l"
        gap="l"
        width="100%"
        display="flex"
        color="onSurface"
        justifyContent="flex-end"
      >
        <Box onClick={() => setOpen(true)} p="l">
          <HamburgerSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
        </Box>
      </Box>
      {isOpen && (
        <Box>
          <Box
            top="0"
            left="0"
            right="0"
            bottom="0"
            position="fixed"
            onClick={() => setOpen(false)}
          />
          <Box
            right="1rem"
            display="flex"
            position="absolute"
            bg="surface.container"
            flexDirection="column"
          >
            <MintButtons
              lastETHEpoch={userInfo.lastETHEpoch}
              lastUSDCEpoch={userInfo.lastUSDCEpoch}
            />
            <ZKLogin />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DropdownMenu;
