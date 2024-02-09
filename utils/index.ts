import { SUI_TYPE_ARG } from '@mysten/sui.js/utils';
import { LOYALTY_OBJECT_TYPE } from '@/constants';

import { SuiClient } from '@mysten/sui.js/client';

export * from './big-number';
export * from './coin';
export * from './parse';
export * from './string';
export * from './toast';
export * from './tx';

export const noop = () => {};

export const normalizeSuiType = (x: string) => {
  if (x === SUI_TYPE_ARG) return x;
  const splitType = x.split('::');

  const packageType = splitType[0];

  if (packageType.length === 66) return x;

  if (!packageType.includes('0x')) return x;

  const postOx = packageType.split('0x')[1];

  const paddedType = '0x' + postOx.padStart(64, '0');

  return [paddedType, ...splitType.slice(1)].join('::');
};

export const getLoyaltyAccount = async (
  suiClient: SuiClient,
  userAddr: string
) => {
  const objects = await suiClient.getOwnedObjects({
    owner: userAddr,
    options: {
      showType: true,
    },
  });

  const LoyaltyAccount = objects.data.find(
    (obj) => obj?.data?.type === LOYALTY_OBJECT_TYPE
  );

  return LoyaltyAccount?.data;
};
