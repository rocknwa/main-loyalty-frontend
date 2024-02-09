import { Box } from '@interest-protocol/ui-kit';

import StakeFormButton from './stake-buttons';

const StakeForm = ({ formStake }) => {
  return (
    <Box mx="auto" width="100%">
      <StakeFormButton formStake={formStake} />
    </Box>
  );
};

export default StakeForm;
