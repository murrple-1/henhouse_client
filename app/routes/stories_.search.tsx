import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import { Field, Form, Formik } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Category, getCategories } from '~/api/http/category.http';
import { Tag, getTags } from '~/api/http/tag.http';
import { getSessionId } from '~/api/sessionid.lib';
import { QueryParams, allPages, generateQueryString } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: 'Henhouse Server - Search' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
}

export const loader: LoaderFunction = async ({
  request,
}): Promise<LoaderData> => {
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

enum DateRange {
  ANY = 'any',
  ONE_WEEK = '1w',
  ONE_MONTH = '1M',
  THREE_MONTH = '3M',
  SIX_MONTH = '6M',
  ONE_YEAR = '1y',
}

const DateRangeMappings: { title: string; value: DateRange }[] = [
  { title: 'Any', value: DateRange.ANY },
  { title: '1 Week', value: DateRange.ONE_WEEK },
  { title: '1 Month', value: DateRange.ONE_MONTH },
  { title: '3 Months', value: DateRange.THREE_MONTH },
  { title: '6 Months', value: DateRange.SIX_MONTH },
  { title: '1 Year', value: DateRange.ONE_YEAR },
];

enum DateRangeBeyond {
  AND_OLDER = 'older',
  AND_NEWER = 'newer',
}

const DateRangeBeyondMappings: { title: string; value: DateRangeBeyond }[] = [
  { title: 'And Older', value: DateRangeBeyond.AND_OLDER },
  { title: 'And Newer', value: DateRangeBeyond.AND_NEWER },
];

enum Sort {
  ALPHABETICAL,
  RELEVANCY,
  DATE,
  SCORE,
  NUM_COMMENTS,
}

const SortMappings: { title: string; value: Sort }[] = [
  { title: 'Alphabetical', value: Sort.ALPHABETICAL },
  { title: 'Date', value: Sort.DATE },
];

interface FormValues {
  searchText: string;
  searchText_title: boolean;
  searchText_synopsis: boolean;
  searchText_storyText: boolean;
  searchDateRange: string;
  searchDateRangeBeyond: string;
  sort: string;
  searchAuthorName: string;
}

const TAGS_FILTER_DEBOUNCE_INTERVAL_MS = 500;
const CATEGORY_FILTER_DEBOUNCE_INTERVAL_MS = 500;

const View: React.FC = () => {
  const navigate = useNavigate();

  const { data: configService } = useConfig();

  const initialValues = useMemo<FormValues>(
    () => ({
      searchText: '',
      searchText_title: true,
      searchText_synopsis: false,
      searchText_storyText: false,
      searchTags: [],
      searchDateRange: 'any',
      searchDateRangeBeyond: 'older',
      searchCategories: ['__all__'],
      sort: 'alphabetical',
      searchAuthorName: '',
    }),
    [],
  );

  const [tagsFilter, setTagsFilter] = useState('');
  const [debouncedTagsFilter, setDebouncedTagsFilter] = useState('');

  const [selectedSearchTags, setSelectedSearchTags] = useState<Tag[]>([]);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [debouncedCategoryFilter, setDebouncedCategoryFilter] = useState('');

  const [selectedSearchCategories, setSelectedSearchCategories] = useState<
    Category[]
  >([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedTagsFilter(tagsFilter);
    }, TAGS_FILTER_DEBOUNCE_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [tagsFilter, setDebouncedTagsFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCategoryFilter(categoryFilter);
    }, CATEGORY_FILTER_DEBOUNCE_INTERVAL_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [categoryFilter, setDebouncedCategoryFilter]);

  const onTagsFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTagsFilter(e.target.value);
    },
    [setTagsFilter],
  );

  const onCategoryFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCategoryFilter(e.target.value);
    },
    [setCategoryFilter],
  );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return allPages((limit, offset) =>
        getCategories(host, { limit, offset }, null),
      );
    },
    enabled: configService !== undefined,
  });

  const [filteredCategories, setFilteredCategories] = useState(
    categories ?? [],
  );

  useEffect(() => {
    if (categories === undefined) {
      return;
    }

    setFilteredCategories(
      categories.filter(c =>
        c.prettyName.toLowerCase().includes(debouncedCategoryFilter.trim()),
      ),
    );
  }, [categories, debouncedCategoryFilter, setFilteredCategories]);

  const { data: tags } = useQuery({
    queryKey: ['tags', debouncedTagsFilter.trim()],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getTags(
        host,
        {
          sort: 'name:ASC',
          search: `name:"${debouncedTagsFilter.trim()}"`,
        },
        null,
      );
    },
    enabled: configService !== undefined && debouncedTagsFilter.trim() !== '',
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      const params: QueryParams = {};

      console.log(values);

      const searchText_ = values.searchText.trim();
      if (searchText_) {
        if (values.searchText_title) {
          params['searchTitle'] = searchText_;
        }

        if (values.searchText_synopsis) {
          params['searchSynopsis'] = searchText_;
        }
        if (values.searchText_storyText) {
          params['searchStoryText'] = searchText_;
        }
      }

      if (selectedSearchTags.length > 0) {
        params['searchTags'] = selectedSearchTags.map(t => t.name).join(',');
      }

      switch (values.searchDateRange) {
        case DateRange.ANY: {
          break;
        }
        case DateRange.ONE_WEEK: {
          switch (values.searchDateRangeBeyond) {
            case DateRangeBeyond.AND_OLDER: {
              params['searchDateRange'] = 'older_than:1w';
              break;
            }
            case DateRangeBeyond.AND_NEWER: {
              params['searchDateRange'] = 'earlier_than:1w';
              break;
            }
            default: {
              throw new Error('unknown search date range beyond');
            }
          }
          break;
        }
        case DateRange.ONE_MONTH: {
          switch (values.searchDateRangeBeyond) {
            case DateRangeBeyond.AND_OLDER: {
              params['searchDateRange'] = 'older_than:1M';
              break;
            }
            case DateRangeBeyond.AND_NEWER: {
              params['searchDateRange'] = 'earlier_than:1M';
              break;
            }
            default: {
              throw new Error('unknown search date range beyond');
            }
          }
          break;
        }
        case DateRange.THREE_MONTH: {
          switch (values.searchDateRangeBeyond) {
            case DateRangeBeyond.AND_OLDER: {
              params['searchDateRange'] = 'older_than:3M';
              break;
            }
            case DateRangeBeyond.AND_NEWER: {
              params['searchDateRange'] = 'earlier_than:3M';
              break;
            }
            default: {
              throw new Error('unknown search date range beyond');
            }
          }
          break;
        }
        case DateRange.SIX_MONTH: {
          switch (values.searchDateRangeBeyond) {
            case DateRangeBeyond.AND_OLDER: {
              params['searchDateRange'] = 'older_than:3M';
              break;
            }
            case DateRangeBeyond.AND_NEWER: {
              params['searchDateRange'] = 'earlier_than:3M';
              break;
            }
            default: {
              throw new Error('unknown search date range beyond');
            }
          }
          break;
        }
        case DateRange.ONE_YEAR: {
          switch (values.searchDateRangeBeyond) {
            case DateRangeBeyond.AND_OLDER: {
              params['searchDateRange'] = 'older_than:1y';
              break;
            }
            case DateRangeBeyond.AND_NEWER: {
              params['searchDateRange'] = 'earlier_than:1y';
              break;
            }
            default: {
              throw new Error('unknown search date range beyond');
            }
          }
          break;
        }
        default:
          throw new Error('unknown search date range');
      }

      if (selectedSearchCategories.length > 0) {
        params['searchCategories'] = selectedSearchCategories
          .map(c => c.name)
          .join(',');
      }

      // TODO various values
      params['sort'] = 'title:ASC';

      const searchAuthorName_ = values.searchAuthorName.trim();
      if (searchAuthorName_) {
        params['searchAuthorName'] = searchAuthorName_;
      }

      navigate(`/stories${generateQueryString(params)}`);
    },
    [navigate, selectedSearchCategories, selectedSearchTags],
  );

  let selectedTagElements: React.ReactElement | React.ReactElement[];
  if (selectedSearchTags.length > 0) {
    // TODO it would be cool if there was a cap on number of tags to show, with like a "show more" button at the end
    selectedTagElements = selectedSearchTags.map((t, i) => (
      <div
        key={`selectedTagElements-${i}`}
        className="mr-2 rounded p-1 dark:bg-green-900"
      >
        <span className="mr-1">{t.prettyName}</span>
        <FontAwesomeIcon
          icon={faXmark}
          onClick={() => {
            setSelectedSearchTags(selectedSearchTags.filter(t_ => t_ !== t));
          }}
        />
      </div>
    ));
  } else {
    selectedTagElements = (
      <div className="mr-2 rounded p-1 dark:bg-slate-600">None Selected</div>
    );
  }

  let searchTagsOptionElements: React.ReactElement | React.ReactElement[];
  if (debouncedTagsFilter.trim().length > 0 && tags !== undefined) {
    const unselectedTags = tags.items.filter(
      t => !selectedSearchTags.includes(t),
    );
    if (unselectedTags.length > 0) {
      searchTagsOptionElements = unselectedTags.map((t, i) => (
        <option
          key={`searchTagsOptionElements-${i}`}
          value={t.name}
          onDoubleClick={() => {
            setSelectedSearchTags([...selectedSearchTags, t]);
          }}
        >
          {t.prettyName}
        </option>
      ));
    } else {
      searchTagsOptionElements = (
        <option value="" disabled>
          No Tags Found
        </option>
      );
    }
  } else {
    searchTagsOptionElements = (
      <option value="" disabled>
        No Tags Loaded
      </option>
    );
  }

  let selectedCategoryElements: React.ReactElement | React.ReactElement[];
  if (selectedSearchCategories.length > 0) {
    // TODO it would be cool if there was a cap on number of tags to show, with like a "show more" button at the end
    selectedCategoryElements = selectedSearchCategories.map((c, i) => (
      <div
        key={`selectedCategoryElements-${i}`}
        className="mr-2 rounded p-1 dark:bg-green-900"
      >
        <span className="mr-1">{c.prettyName}</span>
        <FontAwesomeIcon
          icon={faXmark}
          onClick={() => {
            setSelectedSearchCategories(
              selectedSearchCategories.filter(c_ => c_ !== c),
            );
          }}
        />
      </div>
    ));
  } else {
    selectedCategoryElements = (
      <div className="mr-2 rounded p-1 dark:bg-slate-600">None Selected</div>
    );
  }

  const searchCategoryOptionElements = filteredCategories
    .filter(c => !selectedSearchCategories.includes(c))
    .map((c, i) => (
      <option
        key={`categoryElements-${i}`}
        value={c.name}
        onDoubleClick={() => {
          setSelectedSearchCategories([...selectedSearchCategories, c]);
        }}
      >
        {c.prettyName}
      </option>
    ));

  const dateRangeOptionElements = DateRangeMappings.map((e, i) => (
    <option key={`dateRangeOptionElements-${i}`} value={e.value}>
      {e.title}
    </option>
  ));

  const dateRangeBeyondOptionElements = DateRangeBeyondMappings.map((e, i) => (
    <option key={`dateRangeBeyondOptionElements-${i}`} value={e.value}>
      {e.title}
    </option>
  ));

  const sortOptionElements = SortMappings.map((e, i) => (
    <option key={`sortOptionElements-${i}`} value={e.value}>
      {e.title}
    </option>
  ));

  return (
    <MainContainer>
      <h1 className="mb-2 text-lg">Advanced Search</h1>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {() => (
          <Form className="flex w-full flex-col p-2">
            <Field
              name="searchText"
              type="text"
              placeholder="Search for Stories"
            />
            <div className="my-2 rounded p-2 dark:bg-gray-700">
              <h2>Search In:</h2>
              <div className="flex flex-row">
                <label htmlFor="searchText_title" className="mr-2">
                  Title:
                </label>
                <Field type="checkbox" name="searchText_title" />
              </div>
              <div className="flex flex-row">
                <label htmlFor="searchText_synopsis" className="mr-2">
                  Synopsis:
                </label>
                <Field type="checkbox" name="searchText_synopsis" />
              </div>
              <div className="flex flex-row">
                <label htmlFor="searchText_storyText" className="mr-2">
                  Story Text:
                </label>
                <Field type="checkbox" name="searchText_storyText" />
              </div>
            </div>
            <h2>Tags:</h2>
            <div className="my-2 flex flex-row">{selectedTagElements}</div>
            <input
              type="text"
              value={tagsFilter}
              onChange={onTagsFilterChange}
              className="border-2 border-slate-700"
              placeholder="Filter Tags"
            />
            <div className="text-sm text-gray-400">
              Double-click to select tags
            </div>
            <select className="h-18 mb-2 border-2 border-slate-700" multiple>
              {searchTagsOptionElements}
            </select>
            <label htmlFor="searchDateRange">Date Range:</label>
            <div className="mb-2 flex flex-row">
              <Field
                as="select"
                name="searchDateRange"
                className="mr-2 flex-grow border-2 border-slate-700"
              >
                {dateRangeOptionElements}
              </Field>
              <Field
                as="select"
                name="searchDateRangeBeyond"
                className="flex-grow border-2 border-slate-700"
              >
                {dateRangeBeyondOptionElements}
              </Field>
            </div>
            <h2>Categories:</h2>
            <div className="my-2 flex flex-row">{selectedCategoryElements}</div>
            <input
              type="text"
              value={categoryFilter}
              onChange={onCategoryFilterChange}
              className="border-2 border-slate-700"
              placeholder="Filter Categories"
            />
            <div className="text-sm text-gray-400">
              Double-click to select categories
            </div>
            <select className="mb-2 border-2 border-slate-700" multiple>
              {searchCategoryOptionElements}
            </select>
            <label htmlFor="sort">Sort:</label>
            <Field
              as="select"
              name="sort"
              className="mb-2 border-2 border-slate-700"
            >
              {sortOptionElements}
            </Field>
            <label htmlFor="searchAuthorName">Author&apos;s Name:</label>
            <Field
              name="searchAuthorName"
              type="text"
              className="mb-4 border-2 border-slate-700"
            />
            <div className="flex flex-row justify-center">
              <button type="submit" className="w-1/2 rounded bg-red-500">
                Search
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </MainContainer>
  );
};

View.displayName = 'Stories/Search';

const Index: React.FC = () => {
  const { dehydratedState } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View />
    </HydrationBoundary>
  );
};

export default Index;
