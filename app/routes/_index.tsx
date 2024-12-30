import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

const View: React.FC = () => {
  return <div className="container mx-auto px-4">Home</div>;
};

const Index: React.FC = () => {
  return <View />;
};

export default Index;
