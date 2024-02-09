import { Button } from '@interest-protocol/ui-kit';
import { FC } from 'react';

import {
  beginZKLogin,
  clearSetupData,
} from '@/components/zk-login/zk-login.utils';
import { useSuiClient, useWeb3 } from '@/hooks';
import { SignOutSVG } from '@/svg';

import {} from './zk-login.utils';

const ZKLogin: FC = () => {
  const suiClient = useSuiClient();
  const { account, setAccount, isLoggingIn, setIsLoggingIn } = useWeb3();

  return (
    <>
      {account ? (
        <>
          <Button size="small" variant="filled" bg="none" disabled>
            {account.userAddr.slice(0, 6)}...{account.userAddr.slice(-5)}
          </Button>
          <Button
            color="error"
            variant="icon"
            display={['none', 'none', 'inline-flex']}
            onClick={async () => {
              clearSetupData();
              setAccount(null);
            }}
          >
            <SignOutSVG maxHeight="1rem" maxWidth="1rem" width="100%" />
          </Button>
          <Button
            size="small"
            color="error"
            variant="filled"
            bg="transparent"
            display={['inline-flex', 'inline-flex', 'none']}
            PrefixIcon={
              <SignOutSVG maxHeight="1rem" maxWidth="1rem" width="100%" />
            }
            onClick={async () => {
              clearSetupData();
              setAccount(null);
            }}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Button
          size="small"
          variant="filled"
          disabled={isLoggingIn}
          onClick={async () => {
            setIsLoggingIn(true);
            await beginZKLogin(suiClient, 'Google').catch(console.warn);
          }}
        >
          Sign with Google
        </Button>
      )}
    </>
  );
};

export default ZKLogin;
