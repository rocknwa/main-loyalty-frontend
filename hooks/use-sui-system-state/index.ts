import useSWR from 'swr';

import { makeSWRKey } from '@/utils';

import { useSuiClient } from '../use-sui-client';

export const useSuiSystemState = () => {
  const suiClient = useSuiClient();
  return useSWR(
    makeSWRKey([], suiClient.getLatestSuiSystemState.name),
    async () => suiClient.getLatestSuiSystemState(),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      refreshWhenHidden: false,
      refreshInterval: 10000,
    }
  );
};
