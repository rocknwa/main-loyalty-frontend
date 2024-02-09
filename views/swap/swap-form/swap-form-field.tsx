import {
  Box,
  Button,
  TextField,
  Theme,
  Typography,
  useTheme,
} from '@interest-protocol/ui-kit';
import { pathOr } from 'ramda';
import { ChangeEvent, FC } from 'react';
import { useWatch } from 'react-hook-form';

import { TOKENS_SVG_MAP_V2 } from '@/constants';
import { useWeb3 } from '@/hooks';
import { FixedPointMath } from '@/lib';
import { parseInputEventToNumberString, ZERO_BIG_NUMBER } from '@/utils';

import { SwapInputProps, TextFieldWrapperProps } from '../swap.types';
import SwapFormFieldSlider from './swap-form-slider';

const TextFieldWrapper: FC<TextFieldWrapperProps> = ({
  name,
  errors,
  register,
  setValue,
  currentTokenType,
  currentTokenSymbol,
}) => {
  const { dark } = useTheme() as Theme;
  const Icon = TOKENS_SVG_MAP_V2[currentTokenType] ?? TOKENS_SVG_MAP_V2.default;

  const errorMessageKey = errors[name]?.message;

  return (
    <TextField
      placeholder="0"
      textAlign="right"
      disabled={name === 'to' || !currentTokenType}
      error={currentTokenType && errorMessageKey}
      {...register(`${name}.value`, {
        onChange: (v: ChangeEvent<HTMLInputElement>) => {
          setValue('maxValue', false);
          setValue?.(`${name}.value`, parseInputEventToNumberString(v));
        },
      })}
      Prefix={
        <Button
          pl="m"
          size="small"
          variant="filled"
          whiteSpace="nowrap"
          bg="surface.container"
          color={dark ? 'white' : 'black'}
          PrefixIcon={
            <Box as="span" display="inline-block">
              <Icon
                width="100%"
                height="100%"
                maxWidth="2rem"
                maxHeight="2rem"
              />
            </Box>
          }
        >
          <Typography variant="medium">{currentTokenSymbol}</Typography>
        </Button>
      }
    />
  );
};

const SwapFormField: FC<SwapInputProps> = ({
  name,
  formSwap: {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  },
}) => {
  const { coinsMap } = useWeb3();
  const currentTokenType = useWatch({
    control: control,
    name: `${name}.type`,
  });

  const balance = FixedPointMath.toNumber(
    pathOr(ZERO_BIG_NUMBER, [currentTokenType, 'totalBalance'], coinsMap),
    getValues(`${name}.decimals`)
  );

  return (
    <Box pt="s">
      <Box
        mb="xs"
        display="flex"
        color="onSurface"
        justifyContent="space-between"
      >
        <Typography variant="medium">
          {name === 'from' ? 'From' : 'To'}
        </Typography>
        <Typography variant="medium">Balance: {balance}</Typography>
      </Box>
      <TextFieldWrapper
        name={name}
        errors={errors}
        control={control}
        register={register}
        setValue={setValue}
        currentTokenType={currentTokenType}
        currentTokenSymbol={getValues(`${name}.symbol`)}
      />
      {name === 'from' && (
        <SwapFormFieldSlider
          balance={balance}
          setValue={setValue}
          currentValue={+getValues('from.value')}
        />
      )}
    </Box>
  );
};

export default SwapFormField;
