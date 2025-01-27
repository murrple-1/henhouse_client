import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';

import { getCategories } from '~/api/http/category.http';
import { getSessionId } from '~/api/sessionid.lib';
import { allPages } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
}

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const cookieHeader = request.headers.get('Cookie');
  let sessionId: string | null;
  if (cookieHeader !== null) {
    sessionId = getSessionId(cookieHeader);
  } else {
    sessionId = null;
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () =>
      allPages((limit, offset) =>
        getCategories(
          process.env.API_HOST as string,
          { limit, offset },
          sessionId,
        ),
      ),
  });

  return {
    dehydratedState: dehydrate(queryClient),
  };
};

const categoryGridStyle: React.CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(25%, 1fr))',
  columnGap: '0.5rem',
  rowGap: '0.5rem',
};

const View: React.FC = () => {
  const { data: configService } = useConfig();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      allPages((limit, offset) =>
        getCategories(process.env.API_HOST as string, { limit, offset }, null),
      ),
    enabled: configService !== undefined,
  });

  const categoryElements = categories?.map((category, index) => (
    <div
      key={`categoryElements-${index}`}
      className="rounded bg-sky-100 p-2 text-center"
    >
      <Link to={`/stories?category=${category.name}`} className="text-red-500">
        {category.prettyName}
      </Link>
      <div className="text-sm">{category.description}</div>
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
  const { dehydratedState } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View />
    </HydrationBoundary>
  );
};

export default Index;
