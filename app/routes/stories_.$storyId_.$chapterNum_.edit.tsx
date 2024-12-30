import { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

const Index: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      Stories/storyId/chapterNum/Edit
    </div>
  );
};

export default Index;
