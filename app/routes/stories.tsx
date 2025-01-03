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
import React, { useCallback, useState } from 'react';

import { SortField, getStories } from '~/api/http/story.http';
import { QueryOptions } from '~/api/query.interface';
import { getSessionId } from '~/api/sessionid.lib.server';
import { Sort } from '~/api/sort.interface';
import { QueryParams, generateQueryString } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { Pagination } from '~/components/pagination';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

function generateSearchOptions(
  limit: number | null,
  offset: number | null,
  searchText: string | null,
): QueryOptions<SortField> {
  let search: string | undefined;
  if (searchText) {
    search = `title:"${searchText}"`;
  } else {
    search = undefined;
  }

  return {
    limit: limit ?? undefined,
    offset: offset ?? undefined,
    search,
    sort: new Sort([['title', 'ASC']]),
  };
}

interface LoaderData {
  dehydratedState: DehydratedState;
  limit: number;
  offset: number;
  search: string | null;
}

const DEFAULT_LIMIT = 20;

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const url = new URL(request.url);

  const limitQuery = url.searchParams.get('limit');
  const offsetQuery = url.searchParams.get('offset');
  const searchQuery = url.searchParams.get('search');

  let limit: number = DEFAULT_LIMIT;
  let offset: number = 0;
  let search: string | null = null;

  if (limitQuery !== null) {
    limit = parseInt(limitQuery, 10);
    if (isNaN(limit)) {
      limit = DEFAULT_LIMIT;
    }
  }

  if (offsetQuery !== null) {
    offset = parseInt(offsetQuery, 10);
    if (isNaN(offset)) {
      offset = 0;
    }
  }

  if (searchQuery !== null) {
    search = searchQuery;
  }

  const queryClient = new QueryClient();

  const options = generateSearchOptions(limit, offset, search);

  await queryClient.prefetchQuery({
    queryKey: ['stories', limit, offset, search],
    queryFn: () =>
      getStories(process.env.API_HOST as string, options, sessionId),
  });
  return {
    dehydratedState: dehydrate(queryClient),
    limit,
    offset,
    search,
  };
};

interface Props {
  initialLimit: number;
  initialOffset: number;
  initialSearchText: string | null;
}

const View: React.FC<Props> = ({
  initialLimit,
  initialOffset,
  initialSearchText,
}) => {
  const [limit, setLimit] = useState<number>(initialLimit);
  const [offset, setOffset] = useState<number>(initialOffset);
  const [searchText, setSearchText] = useState<string | null>(
    initialSearchText,
  );

  const [searchOptions, setSearchOptions] = useState<QueryOptions<SortField>>(
    () => generateSearchOptions(limit, offset, searchText),
  );

  const { data: configService } = useConfig();

  const { data: stories } = useQuery({
    queryKey: [
      'stories',
      searchOptions.limit,
      searchOptions.offset,
      searchOptions.search,
    ],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStories(host, searchOptions, null);
    },
    enabled: configService !== undefined,
  });

  const onLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLimit(parseInt(e.target.value));
    },
    [setLimit],
  );

  const onOffsetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setOffset(parseInt(e.target.value));
    },
    [setOffset],
  );

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const onSearch = useCallback(() => {
    setSearchOptions(generateSearchOptions(limit, offset, searchText));
  }, [setSearchOptions, limit, offset, searchText]);

  const toHrefFn = useCallback(
    (offset: number, limit: number) => {
      const params: QueryParams = {
        'limit': limit.toString(10),
        'offset': offset.toString(10),
      };

      if (searchText) {
        params['search'] = searchText;
      }

      return `/stories${generateQueryString(params)}`;
    },
    [searchText],
  );

  const storyTitleElements = stories?.items.map((s, i) => (
    <div key={`storyTitles-${i}`}>
      <Link to={`/stories/${s.uuid}`}>{s.title}</Link>
    </div>
  ));

  let paginationElement: React.ReactElement | null;
  if (stories !== undefined) {
    paginationElement = (
      <Pagination
        limit={limit}
        currentOffset={offset}
        totalEntries={stories.count}
        toHrefFn={toHrefFn}
      />
    );
  } else {
    paginationElement = null;
  }

  return (
    <MainContainer>
      <div>
        <input
          type="number"
          value={limit !== null ? limit.toString(10) : ''}
          onChange={onLimitChange}
        />
        <input
          type="number"
          value={offset !== null ? offset.toString(10) : ''}
          onChange={onOffsetChange}
        />
        <input value={searchText ?? ''} onChange={onSearchTextChange} />
        <button type="button" onClick={onSearch}>
          Search
        </button>
      </div>
      <div>{storyTitleElements}</div>
      <div>{paginationElement}</div>
    </MainContainer>
  );
};

const Index: React.FC = () => {
  const { dehydratedState, limit, offset, search } =
    useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View
        initialLimit={limit}
        initialOffset={offset}
        initialSearchText={search}
      />
    </HydrationBoundary>
  );
};

export default Index;
