import { ChangeEvent } from 'react';

import { MAX_NUMBER_INPUT_VALUE } from '@/constants';

export const parseInputEventToNumberString = (
  event: ChangeEvent<HTMLInputElement>,
  max: number = MAX_NUMBER_INPUT_VALUE
): string => {
  const value = event.target.value;

  const x =
    isNaN(+value[value.length - 1]) && value[value.length - 1] !== '.'
      ? value.slice(0, value.length - 1)
      : value;

  if (isNaN(+x)) return '';

  if (+x >= max) return max.toString();

  if (x.charAt(0) == '0' && !x.startsWith('0.')) return String(Number(x));

  if (
    value.includes('.') &&
    value[value.length - 1] !== '.' &&
    value[value.length - 1] !== '0'
  )
    return (+parseFloat(x).toFixed(6)).toPrecision();

  return x;
};

export function isHexString(value: any, length?: number): boolean {
  if (typeof value !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false;
  }
  if (length && value.length !== 2 + 2 * length) {
    return false;
  }
  return true;
}
