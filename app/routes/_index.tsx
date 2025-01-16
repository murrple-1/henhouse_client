import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

import { MainContainer } from '~/components/main-container';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface Category {
  name: string;
}

const categoryGridStyle: React.CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(25%, 1fr))',
  columnGap: '0.5rem',
  rowGap: '0.5rem',
};

const View: React.FC = () => {
  const categories: Category[] = [
    {
      name: 'Sci-fi',
    },
    {
      name: 'Fantasy',
    },
    {
      name: 'True Crime',
    },
    {
      name: 'Mystery',
    },
  ];

  const categoryElements = categories.map((c, i) => (
    <div className="rounded bg-sky-100 p-2 text-center">
      <Link to={``} className="text-red-500">
        {c.name}
      </Link>
    </div>
  ));

  return (
    <MainContainer>
      <div className="w-full text-slate-800">
        <div className="mb-8 flex w-full flex-col items-center rounded bg-sky-100 p-2">
          <div>Henhouse</div>
          <div className="text-sm">
            A clucking-good online repository of fiction
          </div>
        </div>
        <div className="mb-2 flex w-full flex-col items-center rounded bg-sky-100 p-2">
          Categories
        </div>
        <div className="mb-8 grid w-full" style={categoryGridStyle}>
          {categoryElements}
        </div>
        <div className="mb-2 flex w-full flex-col items-center rounded bg-sky-100 p-2">
          <Link to="/stories" className="text-red-500">
            All Stories
          </Link>
        </div>
        <div className="mb-2 flex w-full flex-col items-center rounded bg-sky-100 p-2">
          <Link to="/stories?sort=createdAt:DESC" className="text-red-500">
            Newest Stories
          </Link>
        </div>
        <div className="mb-2 flex w-full flex-col items-center rounded bg-sky-100 p-2">
          <Link to="/stories/search" className="text-red-500">
            Story Search
          </Link>
        </div>
        <div className="mb-2 flex w-full flex-col items-center rounded bg-sky-100 p-2">
          <Link to="/stories/create" className="text-red-500">
            Submit a Story
          </Link>
        </div>
      </div>
    </MainContainer>
  );
};

const Index: React.FC = () => {
  return <View />;
};

export default Index;
