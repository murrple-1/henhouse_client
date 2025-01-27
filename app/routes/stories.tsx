import {
  faBookmark,
  faGear,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  StoryWithUser,
  getStoriesWithUsers,
} from '~/api/facade/story-with-user.http';
import { SortField } from '~/api/http/story.http';
import { QueryOptions } from '~/api/query.interface';
import { getSessionId } from '~/api/sessionid.lib';
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
  searchCategory: string | null,
): QueryOptions<SortField> {
  const searchParts: string[] = [];
  if (searchText) {
    searchParts.push(`title:"${searchText}"`);
  }

  if (searchCategory) {
    searchParts.push(`category:"${searchCategory}"`);
  }

  const search = searchParts.length > 0 ? searchParts.join(' AND ') : undefined;

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
  searchText: string | null;
  searchCategory: string | null;
}

const DEFAULT_LIMIT = 20;

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

  const url = new URL(request.url);

  const limitQuery = url.searchParams.get('limit');
  const offsetQuery = url.searchParams.get('offset');
  const searchTextQuery = url.searchParams.get('search');
  const searchCategoryQuery = url.searchParams.get('category');

  let limit: number = DEFAULT_LIMIT;
  let offset: number = 0;
  let searchText: string | null = null;
  let searchCategory: string | null = null;

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

  if (searchTextQuery !== null) {
    searchText = searchTextQuery;
  }

  if (searchCategoryQuery !== null) {
    searchCategory = searchCategoryQuery;
  }

  const queryClient = new QueryClient();

  const options = generateSearchOptions(
    limit,
    offset,
    searchText,
    searchCategory,
  );

  await queryClient.prefetchQuery({
    queryKey: ['stories:withUsers', limit, offset, searchText, searchCategory],
    queryFn: () =>
      getStoriesWithUsers(process.env.API_HOST as string, options, sessionId),
  });
  return {
    dehydratedState: dehydrate(queryClient),
    limit,
    offset,
    searchText,
    searchCategory,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

interface StoryCardProps {
  storyWithUser: StoryWithUser;
  datetimeFormatter: Intl.DateTimeFormat;
}

const StoryCard: React.FC<StoryCardProps> = memo(
  ({ storyWithUser: s, datetimeFormatter }) => {
    return (
      <div className="mb-2 flex w-full flex-row rounded bg-sky-100 p-2">
        <div className="flex flex-grow flex-col">
          <div className="text-red-500">
            <Link to={`/stories/${s.uuid}`}>{s.title}</Link>
          </div>
          <div className="">
            <div className="text-sm">{s.synopsis}</div>
          </div>
          <div className="text-sm">
            by{' '}
            <Link to={`/user/${s.userUuid}`} className="text-red-500">
              {s.username}
            </Link>
          </div>
        </div>
        <div className="ml-32 flex flex-col">
          <div className="flex flex-row justify-end">
            <FontAwesomeIcon icon={faBookmark} height="1em" />
          </div>
          <div className="">
            {s.publishedAt !== null
              ? datetimeFormatter.format(s.publishedAt)
              : 'N/A'}
          </div>
        </div>
      </div>
    );
  },
);

interface Props {
  initialLimit: number;
  initialOffset: number;
  initialSearchText: string | null;
  initialSearchCategory: string | null;
}

const View: React.FC<Props> = ({
  initialLimit,
  initialOffset,
  initialSearchText,
  initialSearchCategory,
}) => {
  const [searchParams] = useSearchParams();

  const datetimeFormatter = useMemo(() => new Intl.DateTimeFormat(), []);

  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);
  const [searchText, setSearchText] = useState(initialSearchText);
  const [searchCategory, setSearchCategory] = useState(initialSearchCategory);

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

    const searchParamsSearchText = searchParams.get('search');
    let searchText: string | null;
    if (searchParamsSearchText === null) {
      searchText = null;
    } else {
      searchText = searchParamsSearchText;
    }

    const searchParamsSearchCategory = searchParams.get('category');
    let searchCategory: string | null;
    if (searchParamsSearchCategory === null) {
      searchCategory = null;
    } else {
      searchCategory = searchParamsSearchCategory;
    }

    setLimit(limit);
    setOffset(offset);
    setSearchText(searchText);
    setSearchCategory(searchCategory);
    setCurrentSearchOptions(
      generateSearchOptions(limit, offset, searchText, searchCategory),
    );
  }, [
    searchParams,
    setLimit,
    setOffset,
    setSearchText,
    setSearchCategory,
    setCurrentSearchOptions,
  ]);

  const { data: configService } = useConfig();

  const { data: stories } = useQuery({
    queryKey: [
      'stories:withUsers',
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
      return getStoriesWithUsers(host, currentSearchOptions, null);
    },
    enabled: configService !== undefined && currentSearchOptions !== null,
  });

  const onLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const limit = parseInt(e.target.value, 10);
      setLimit(limit);
      setCurrentSearchOptions(
        generateSearchOptions(limit, offset, searchText, searchCategory),
      );
    },
    [setLimit, offset, searchText, searchCategory],
  );

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const onSearch = useCallback(() => {
    setCurrentSearchOptions(
      generateSearchOptions(limit, offset, searchText, searchCategory),
    );
  }, [setCurrentSearchOptions, limit, offset, searchText, searchCategory]);

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
    <StoryCard
      key={`storyTitles-${i}`}
      storyWithUser={s}
      datetimeFormatter={datetimeFormatter}
    />
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
      <div className="mb-2 flex w-1/2 flex-row border-2 border-slate-700">
        <input
          value={searchText ?? ''}
          onChange={onSearchTextChange}
          className="flex-grow focus:outline-none"
        />
        <button
          type="button"
          onClick={onSearch}
          className="border-l border-white bg-red-500 px-2"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} height="1em" />
        </button>
        <Link
          to="/stories/search"
          className="border-l border-white bg-red-500 px-1"
        >
          <FontAwesomeIcon icon={faGear} height="1em" />
        </Link>
      </div>
      <div className="w-full text-slate-800">{storyTitleElements}</div>
      <div className="mt-3 flex flex-row border-t border-gray-200 pt-1">
        <div className="mr-2 flex flex-row items-end">
          <select
            onChange={onLimitChange}
            value={
              limit !== null ? limit.toString(10) : DEFAULT_LIMIT.toString(10)
            }
            className="border border-slate-700 p-1"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        {paginationElement}
      </div>
    </MainContainer>
  );
};

const Index: React.FC = () => {
  const { dehydratedState, limit, offset, searchText, searchCategory } =
    useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View
        initialLimit={limit}
        initialOffset={offset}
        initialSearchText={searchText}
        initialSearchCategory={searchCategory}
      />
    </HydrationBoundary>
  );
};

export default Index;
