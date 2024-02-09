import { DeepBookClient } from '@mysten/deepbook';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

const testnetClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const client = new DeepBookClient(testnetClient);

export const useDeepHook = () => client;
