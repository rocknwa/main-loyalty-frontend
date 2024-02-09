import { NextPage } from 'next';

import { SEO } from '@/components';
import ErrorPage from '@/views/error';

const NotFoundPage: NextPage = () => (
  <>
    <SEO />
    <ErrorPage />
  </>
);

export default NotFoundPage;
