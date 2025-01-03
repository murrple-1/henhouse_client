import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

import { MainContainer } from '~/components/main-container';

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: 'Henhouse Server - Search' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
}

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
  const queryClient = new QueryClient();

  return {
    dehydratedState: dehydrate(queryClient),
  };
};

const View: React.FC = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const onSearch = useCallback(() => {
    navigate(`/stories?search=${searchText}`);
  }, [navigate, searchText]);

  return (
    <MainContainer>
      <div>
        <input value={searchText ?? ''} onChange={onSearchTextChange} />
        <button type="button" onClick={onSearch}>
          Search
        </button>
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
