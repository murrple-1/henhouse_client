import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Link,
  ShouldRevalidateFunction,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import React, { useCallback, useEffect, useState } from 'react';

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

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

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
  const [searchParams] = useSearchParams();

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);
  const [searchText, setSearchText] = useState(initialSearchText);

  const [currentSearchOptions, setCurrentSearchOptions] =
    useState<QueryOptions<SortField> | null>(null);

  useEffect(() => {
    const searchParamsLimit = searchParams.get('limit');
    let limit: number;
    if (searchParamsLimit === null) {
      limit = DEFAULT_LIMIT;
    } else {
      limit = parseInt(searchParamsLimit, 10);
      if (isNaN(limit)) {
        limit = DEFAULT_LIMIT;
      }
    }

    const searchParamsOffset = searchParams.get('offset');
    let offset: number;
    if (searchParamsOffset === null) {
      offset = 0;
    } else {
      offset = parseInt(searchParamsOffset, 10);
      if (isNaN(offset)) {
        offset = 0;
      }
    }

    const searchParamsSearch = searchParams.get('search');
    let searchText: string | null;
    if (searchParamsSearch === null) {
      searchText = null;
    } else {
      searchText = searchParamsSearch;
    }

    setLimit(limit);
    setOffset(offset);
    setSearchText(searchText);
    setCurrentSearchOptions(generateSearchOptions(limit, offset, searchText));
  }, [
    searchParams,
    setLimit,
    setOffset,
    setSearchText,
    setCurrentSearchOptions,
  ]);

  const { data: configService } = useConfig();

  const { data: stories } = useQuery({
    queryKey: [
      'stories',
      currentSearchOptions?.limit,
      currentSearchOptions?.offset,
      currentSearchOptions?.search,
    ],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      if (currentSearchOptions === null) {
        throw new Error('currentSearchOptions null');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStories(host, currentSearchOptions, null);
    },
    enabled: configService !== undefined && currentSearchOptions !== null,
  });

  const onLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const limit = parseInt(e.target.value, 10);
      setLimit(limit);
      setCurrentSearchOptions(generateSearchOptions(limit, offset, searchText));
    },
    [setLimit, offset, searchText],
  );

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const onSearch = useCallback(() => {
    setCurrentSearchOptions(generateSearchOptions(limit, offset, searchText));
  }, [setCurrentSearchOptions, limit, offset, searchText]);

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
    if (currentSearchOptions === null) {
      throw new Error('currentSearchOptions null');
    }
    if (currentSearchOptions.limit === undefined) {
      throw new Error('searchOptions.limit undefined');
    }
    if (currentSearchOptions.offset === undefined) {
      throw new Error('searchOptions.offset undefined');
    }
    paginationElement = (
      <Pagination
        limit={currentSearchOptions.limit}
        currentOffset={currentSearchOptions.offset}
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
        <input value={searchText ?? ''} onChange={onSearchTextChange} />
        <button type="button" onClick={onSearch}>
          Search
        </button>
      </div>
      <div>{storyTitleElements}</div>
      <div>
        <select
          onChange={onLimitChange}
          value={
            limit !== null ? limit.toString(10) : DEFAULT_LIMIT.toString(10)
          }
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <div>{paginationElement}</div>
      </div>
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
