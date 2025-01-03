import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { MainContainer } from '~/components/main-container';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

const View: React.FC = () => {
  return (
    <MainContainer>
      <div>Home</div>
      <div>
        <Link to="/stories">All Stories</Link>
      </div>
    </MainContainer>
  );
};

const Index: React.FC = () => {
  return <View />;
};

export default Index;
