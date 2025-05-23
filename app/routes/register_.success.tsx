import { MetaFunction } from '@remix-run/node';

import { MainContainer } from '~/components/main-container';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

const Index: React.FC = () => {
  return <MainContainer>Register/success</MainContainer>;
};

export default Index;
