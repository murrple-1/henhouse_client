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
import { Field, Form, Formik, FormikHelpers } from 'formik';
import PropTypes from 'prop-types';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  StoryWithUser,
  getStoriesWithUsers,
} from '~/api/facade/story-with-user.http';
import { getSessionId } from '~/api/sessionid.lib';
import { MainContainer } from '~/components/main-container';
import { Pagination } from '~/components/pagination';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

function escapeSearchQuery(s: string): string {
  return s.replace(/"/g, '\\"');
}

function generateSearchQuery(
  smartSearch: string | null,
  searchTitle: string | null,
  searchSynopsis: string | null,
  searchStoryText: string | null,
  searchTags: string | null,
  searchDateRange: string | null,
  searchCategories: string | null,
  searchAuthorName: string | null,
) {
  const searchParts: string[] = [];
  if (smartSearch) {
    const escapedSmartSearch = escapeSearchQuery(smartSearch);
    searchParts.push(
      `(title:"${escapedSmartSearch}" OR synopsis:"${escapedSmartSearch}" OR storyText:"${escapedSmartSearch}")`,
    );
  }

  if (searchTitle) {
    searchParts.push(`title:"${escapeSearchQuery(searchTitle)}"`);
  }

  if (searchSynopsis) {
    searchParts.push(`synopsis:"${escapeSearchQuery(searchSynopsis)}"`);
  }

  if (searchStoryText) {
    searchParts.push(`storyText:"${escapeSearchQuery(searchStoryText)}"`);
  }

  if (searchTags) {
    searchParts.push(
      ...searchTags.split(',').map(tag => `tag:"${escapeSearchQuery(tag)}"`),
    );
  }

  if (searchDateRange) {
    searchParts.push(
      `publishedAt_delta:"${escapeSearchQuery(searchDateRange)}"`,
    );
  }

  if (searchCategories) {
    searchParts.push(`category:"${escapeSearchQuery(searchCategories)}"`);
  }

  if (searchAuthorName) {
    searchParts.push(`authorName:"${escapeSearchQuery(searchAuthorName)}"`);
  }

  return searchParts.length > 0 ? searchParts.join(' AND ') : null;
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
  smartSearch: string | null;
}

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT = 'title:ASC';

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
  const smartSearchQuery = url.searchParams.get('search');

  let limit: number = DEFAULT_LIMIT;
  let offset: number = 0;
  let smartSearch: string | null = null;

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

  if (smartSearchQuery !== null) {
    smartSearch = smartSearchQuery;
  }

  const queryClient = new QueryClient();

  const searchQuery = generateSearchQuery(
    smartSearch,
    url.searchParams.get('searchTitle'),
    url.searchParams.get('searchSynposis'),
    url.searchParams.get('searchStoryText'),
    url.searchParams.get('searchTags'),
    url.searchParams.get('searchDateRange'),
    url.searchParams.get('searchCategories'),
    url.searchParams.get('searchAuthorName'),
  );

  // TODO sort
  const options = generateSearchOptions(limit, offset, searchQuery, null);

  await queryClient.prefetchQuery({
    queryKey: [
      'stories:withUsers',
      options.limit,
      options.offset,
      options.search,
      options.sort,
    ],
    queryFn: () =>
      getStoriesWithUsers(process.env.API_HOST as string, options, sessionId),
  });
  return {
    dehydratedState: dehydrate(queryClient),
    limit,
    smartSearch,
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
      <div className="mb-2 flex w-full flex-row rounded-sm bg-sky-100 p-2">
        <div className="flex grow flex-col">
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

StoryCard.propTypes = {
  storyWithUser: PropTypes.any.isRequired,
  datetimeFormatter: PropTypes.any.isRequired,
};
StoryCard.displayName = 'StoryCard';

function paramsToSearchOptions(
  searchParams: URLSearchParams,
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
    generateSearchQuery(
      searchParams.get('smartSearch'),
      searchParams.get('searchTitle'),
      searchParams.get('searchSynposis'),
      searchParams.get('searchStoryText'),
      searchParams.get('searchTags'),
      searchParams.get('searchDateRange'),
      searchParams.get('searchCategories'),
      searchParams.get('searchAuthorName'),
    ),
    null,
  );
}

interface SearchFormValues {
  smartSearch: string;
}

interface Props {
  initialLimit: number;
  initialSmartSearch: string | null;
}

const View: React.FC<Props> = ({ initialLimit, initialSmartSearch }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const datetimeFormatter = useMemo(() => new Intl.DateTimeFormat(), []);

  const [limit, setLimit] = useState(initialLimit);
  const initialSearchValues = useMemo<SearchFormValues>(
    () => ({ smartSearch: initialSmartSearch ?? '' }),
    [initialSmartSearch],
  );

  const [currentSearchOptions, setCurrentSearchOptions] =
    useState<PageQueryOptions>(() => paramsToSearchOptions(searchParams));

  useEffect(() => {
    const options = paramsToSearchOptions(searchParams);
    setLimit(options.limit);
    setCurrentSearchOptions(options);
  }, [setLimit, setCurrentSearchOptions, searchParams]);

  const { data: configService } = useConfig();

  const { data: stories } = useQuery({
    queryKey: [
      'stories:withUsers',
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
      return getStoriesWithUsers(host, currentSearchOptions, null);
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

  const onSearchSubmit = useCallback(
    (values: SearchFormValues, actions: FormikHelpers<SearchFormValues>) => {
      const params = new URLSearchParams();
      params.set('smartSearch', values.smartSearch);
      setSearchParams(params);
      actions.setSubmitting(false);
    },
    [setSearchParams],
  );

  const toHrefFn = useCallback(
    (offset: number, limit: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('offset', offset.toString(10));
      params.set('limit', limit.toString(10));

      return `/stories?${params.toString()}`;
    },
    [searchParams],
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
      <div className="mb-2 w-1/2 border-2 border-slate-700">
        <Formik initialValues={initialSearchValues} onSubmit={onSearchSubmit}>
          {() => (
            <Form className="flex flex-row">
              <Field
                type="text"
                name="smartSearch"
                className="grow focus:outline-hidden"
              />
              <button
                type="submit"
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
            </Form>
          )}
        </Formik>
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
  const { dehydratedState, limit, smartSearch } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View initialLimit={limit} initialSmartSearch={smartSearch} />
    </HydrationBoundary>
  );
};

export default Index;
