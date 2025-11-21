import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
  TypedResponse,
} from '@remix-run/node';
import {
  Link,
  ShouldRevalidateFunction,
  redirect,
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
import PropTypes from 'prop-types';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { User, getUserDetails } from '~/api/http/auth.http';
import { Story, getStories } from '~/api/http/story.http';
import { getSessionId } from '~/api/sessionid.lib';
import { ResponseError } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { Pagination } from '~/components/pagination';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction<typeof loader> = ({
  data,
}: {
  data: LoaderData;
}) => {
  return [
    { title: `Henhouse Server - My Stories (${data.username})` },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

function escapeSearchQuery(s: string): string {
  return s.replace(/"/g, '\\"');
}

function generateSearchQuery(myAuthorName: string) {
  return `authorName:"${escapeSearchQuery(myAuthorName)}"`;
}

interface PageQueryOptions {
  limit: number;
  offset: number;
  search?: string;
  sort: string;
}

function generateSearchOptions(
  limit: number,
  offset: number,
  search: string | null,
  sort: string | null,
): PageQueryOptions {
  return {
    limit,
    offset,
    search: search ?? undefined,
    sort: sort ?? DEFAULT_SORT,
  };
}

interface LoaderData {
  dehydratedState: DehydratedState;
  limit: number;
  username: string;
}

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = 'title:ASC';

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData | TypedResponse> => {
  const cookieHeader = request.headers.get('Cookie');
  let sessionId: string | null;
  if (cookieHeader !== null) {
    sessionId = getSessionId(cookieHeader);
  } else {
    sessionId = null;
  }

  if (!sessionId) {
    const url = new URL(request.url);
    return redirect(
      `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
    );
  }

  const url = new URL(request.url);

  const limitQuery = url.searchParams.get('limit');
  const offsetQuery = url.searchParams.get('offset');

  let limit: number = DEFAULT_LIMIT;
  let offset: number = 0;

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

  const queryClient = new QueryClient();

  let user: User;
  try {
    user = await queryClient.fetchQuery({
      queryKey: ['user'],
      queryFn: () => getUserDetails(process.env.API_HOST as string, sessionId),
    });
  } catch (error: unknown) {
    if (error instanceof ResponseError) {
      switch (error.status) {
        case 401: {
          const url = new URL(request.url);
          return redirect(
            `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
          );
        }
      }
    }
    throw new Response('unknown error', { status: 500 });
  }

  const searchQuery = generateSearchQuery(user.username);

  // TODO sort
  const options = generateSearchOptions(limit, offset, searchQuery, null);

  await queryClient.prefetchQuery({
    queryKey: [
      'stories',
      options.limit,
      options.offset,
      options.search,
      options.sort,
    ],
    queryFn: () =>
      getStories(process.env.API_HOST as string, options, sessionId),
  });
  return {
    dehydratedState: dehydrate(queryClient),
    limit,
    username: user.username,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

interface StoryCardProps {
  story: Story;
  datetimeFormatter: Intl.DateTimeFormat;
}

const StoryCard: React.FC<StoryCardProps> = memo(
  ({ story: s, datetimeFormatter }) => {
    return (
      <div className="mb-2 flex w-full flex-row rounded-sm bg-sky-100 p-2">
        <div className="flex grow flex-col">
          <div className="text-red-500">
            <Link to={`/stories/${s.uuid}/edit`}>{s.title}</Link>
          </div>
          <div>
            <div className="text-sm">{s.synopsis}</div>
          </div>
        </div>
        <div className="ml-32 flex flex-col">
          <div className="flex flex-row justify-end">
            <Link to={`/stories/${s.uuid}/edit`}>
              <FontAwesomeIcon icon={faGear} height="1em" />
            </Link>
          </div>
          <div>
            {s.publishedAt !== null
              ? datetimeFormatter.format(s.publishedAt)
              : 'N/A'}
          </div>
        </div>
      </div>
    );
  },
);

StoryCard.propTypes = {
  story: PropTypes.any.isRequired,
  datetimeFormatter: PropTypes.any.isRequired,
};
StoryCard.displayName = 'StoryCard';

function paramsToSearchOptions(
  searchParams: URLSearchParams,
  username: string,
): PageQueryOptions {
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

  // TODO sort
  return generateSearchOptions(
    limit,
    offset,
    generateSearchQuery(username),
    null,
  );
}

interface Props {
  initialLimit: number;
  username: string;
}

const View: React.FC<Props> = ({ initialLimit, username }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const datetimeFormatter = useMemo(() => new Intl.DateTimeFormat(), []);

  const [limit, setLimit] = useState(initialLimit);

  const [currentSearchOptions, setCurrentSearchOptions] =
    useState<PageQueryOptions>(() =>
      paramsToSearchOptions(searchParams, username),
    );

  useEffect(() => {
    const options = paramsToSearchOptions(searchParams, username);
    setLimit(options.limit);
    setCurrentSearchOptions(options);
  }, [setLimit, setCurrentSearchOptions, searchParams, username]);

  const { data: configService } = useConfig();

  const { data: stories } = useQuery({
    queryKey: [
      'stories',
      currentSearchOptions.limit,
      currentSearchOptions.offset,
      currentSearchOptions.search,
      currentSearchOptions.sort,
    ],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStories(host, currentSearchOptions, null);
    },
    enabled: configService !== undefined,
  });
  console.log('stories', stories);

  const onLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const limit_ = parseInt(e.target.value, 10);
      if (isNaN(limit_)) {
        return;
      }

      const params = new URLSearchParams(searchParams);
      params.set('limit', limit_.toString(10));
      setLimit(limit_);
      setSearchParams(params);
    },
    [setLimit, setSearchParams, searchParams],
  );

  const toHrefFn = useCallback(
    (offset: number, limit: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('offset', offset.toString(10));
      params.set('limit', limit.toString(10));

      return `/stories/my?${params.toString()}`;
    },
    [searchParams],
  );

  const storyTitleElements = stories?.items.map((s, i) => (
    <StoryCard
      key={`storyTitles-${i}`}
      story={s}
      datetimeFormatter={datetimeFormatter}
    />
  ));

  let paginationElement: React.ReactElement | null;
  if (stories !== undefined) {
    if (currentSearchOptions === null) {
      throw new Error('currentSearchOptions null');
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
  const { dehydratedState, limit, username } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View initialLimit={limit} username={username} />
    </HydrationBoundary>
  );
};

export default Index;
