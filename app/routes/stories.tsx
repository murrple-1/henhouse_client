import { faBookBookmark, faBookmark } from '@fortawesome/free-solid-svg-icons';
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { User, userLookup } from '~/api/http/auth.http';
import { SortField, getStories } from '~/api/http/story.http';
import { QueryOptions } from '~/api/query.interface';
import { getSessionId } from '~/api/sessionid.lib';
import { Sort } from '~/api/sort.interface';
import { Page, QueryParams, generateQueryString } from '~/api/utils.lib';
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

interface StoryWithUser {
  uuid: string;
  title: string;
  synopsis: string;
  username: string;
  userUuid: string;
  publishedAt: Date | null;
}

async function getStoriesWithUsers(
  host: string,
  options: QueryOptions<SortField>,
  sessionId: string | null,
) {
  return getStories(host, options, sessionId).then(async stories => {
    const userUuids = new Set<string>(stories.items.map(s => s.creator));
    const users = await userLookup(host, Array.from(userUuids), sessionId);
    const userMap: Record<string, User> = {};
    for (const u of users) {
      userMap[u.uuid] = u;
    }
    return {
      items: stories.items.map(s_1 => {
        const user = userMap[s_1.creator] as User;
        return {
          uuid: s_1.uuid,
          title: s_1.title,
          synopsis: s_1.synopsis,
          username: user.username,
          userUuid: user.uuid,
          publishedAt: s_1.publishedAt,
        } satisfies StoryWithUser;
      }),
      count: stories.count,
    } as Page<StoryWithUser>;
  });
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
      getStoriesWithUsers(process.env.API_HOST as string, options, sessionId),
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

  const datetimeFormatter = useMemo(() => new Intl.DateTimeFormat(), []);

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
      return getStoriesWithUsers(host, currentSearchOptions, null);
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
    <div
      className="mb-2 flex flex-row rounded bg-sky-100 p-2"
      key={`storyTitles-${i}`}
    >
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
      <div className="text-slate-800">{storyTitleElements}</div>
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
