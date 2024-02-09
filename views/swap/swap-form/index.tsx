import { Box, Button, Theme, useTheme } from '@interest-protocol/ui-kit';
import { FC, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import useSWR from 'swr';

import { DEEP_BOOK_POOL, ETH_TYPE, ONE_COIN } from '@/constants';
import { useDeepHook } from '@/hooks';
import { DownArrowSVG } from '@/svg';
import { makeSWRKey } from '@/utils';

import { SwapFieldProps, SwapFormProps } from '../swap.types';
import SwapFormButton from './swap-button';
import SwapFormField from './swap-form-field';

const PriceManager: FC<SwapFormProps> = ({ formSwap }) => {
  const deepBook = useDeepHook();
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
  const formValues = useWatch({ control: formSwap.control });

  useEffect(() => {
    const type = formValues.from?.type;
    const value = formValues.from?.value;
    if (!type || !value || !+value) {
      formSwap.setValue('to.value', '0');
      return;
    }

    if (type === ETH_TYPE) {
      const usdcAmount =
        (+value * +(data?.bestAskPrice?.toString() || 0)) / ONE_COIN;
      formSwap.setValue('to.value', usdcAmount.toString());
    } else {
      const ethAmount =
        (+value * ONE_COIN) / +(data?.bestBidPrice?.toString() || 0);
      formSwap.setValue('to.value', ethAmount.toString());
    }
  }, [
    formValues.from?.value,
    formValues.from?.type,
    data?.bestBidPrice,
    data?.bestAskPrice,
  ]);

  return null;
};

const SwapFields: FC<SwapFieldProps> = ({ setValue, getValues }) => {
  const { dark } = useTheme() as Theme;

  const handleClick = () => {
    const { to, from } = getValues();

    setValue('from', { ...to, value: '0' });
    setValue('to', { ...from, value: '0' });
  };

  return (
    <Box display="flex" justifyContent="center">
      <Button
        variant="icon"
        cursor="pointer"
        borderRadius="m"
        border="1px solid"
        alignItems="center"
        display="inline-flex"
        onClick={handleClick}
        justifyContent="center"
        color={dark ? 'textSoft' : 'text'}
        borderColor={dark ? 'textAccent' : '#757680'}
      >
        <DownArrowSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
      </Button>
    </Box>
  );
};

const SwapForm: FC<SwapFormProps> = ({ formSwap }) => {
  return (
    <Box mx="auto" width="100%" gridColumn="1/-1" maxWidth="35.25rem">
      <SwapFormField name="from" formSwap={formSwap} />
      <SwapFields setValue={formSwap.setValue} getValues={formSwap.getValues} />
      <SwapFormField name="to" formSwap={formSwap} />
      <SwapFormButton formSwap={formSwap} />
      <PriceManager formSwap={formSwap} />
    </Box>
  );
};

export default SwapForm;
