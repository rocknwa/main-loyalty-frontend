import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

const testnetClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

export const useSuiClient = (): SuiClient => testnetClient;
