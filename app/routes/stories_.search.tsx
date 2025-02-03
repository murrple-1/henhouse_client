import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useCallback, useMemo } from 'react';

import { getCategories } from '~/api/http/category.http';
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

enum SearchField {
  TITLE = 'title',
  SYNOPSIS = 'synopsis',
  STORY_TEXT = 'story_text',
  TAGS = 'tags',
}

const SearchFieldMappings: { title: string; value: SearchField }[] = [
  { title: 'Title', value: SearchField.TITLE },
  { title: 'Synopsis', value: SearchField.SYNOPSIS },
  { title: 'Story Text', value: SearchField.STORY_TEXT },
  { title: 'Tags', value: SearchField.TAGS },
];

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
  searchFields: string[];
  searchDateRange: string;
  searchDateRangeBeyond: string;
  searchCategories: string[];
  sort: string;
  searchAuthorName: string;
}

const View: React.FC = () => {
  const navigate = useNavigate();

  const { data: configService } = useConfig();

  const intialValues = useMemo<FormValues>(
    () => ({
      searchText: '',
      searchFields: ['title'],
      searchDateRange: 'any',
      searchDateRangeBeyond: 'older',
      searchCategories: ['__all__'],
      sort: 'alphabetical',
      searchAuthorName: '',
    }),
    [],
  );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      allPages((limit, offset) =>
        getCategories(process.env.API_HOST as string, { limit, offset }, null),
      ),
    enabled: configService !== undefined,
  });

  const onSubmit = useCallback(
    (values: FormValues, actions: FormikHelpers<FormValues>) => {
      const params: QueryParams = {};

      const searchText_ = values.searchText.trim();
      if (values.searchFields.includes(SearchField.TITLE)) {
        params['searchTitle'] = searchText_;
      }

      if (values.searchFields.includes(SearchField.SYNOPSIS)) {
        params['searchSynopsis'] = searchText_;
      }
      if (values.searchFields.includes(SearchField.STORY_TEXT)) {
        params['searchStoryText'] = searchText_;
      }

      if (values.searchFields.includes(SearchField.TAGS)) {
        params['searchTags'] = searchText_;
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

      if (!values.searchCategories.includes('__all__')) {
        params['searchCategories'] = values.searchCategories.join(',');
      }

      // TODO various values
      params['sort'] = 'title:ASC';

      const searchAuthorName_ = values.searchAuthorName.trim();
      if (searchAuthorName_) {
        params['searchAuthorName'] = searchAuthorName_;
      }

      navigate(`/stories${generateQueryString(params)}`);
    },
    [navigate],
  );

  const categoryElements = categories?.map(category => (
    <option key={category.name} value={category.name}>
      {category.prettyName}
    </option>
  ));

  const searchFieldOptionElements = SearchFieldMappings.map(e => (
    <option value={e.value}>{e.title}</option>
  ));

  const dateRangeOptionElements = DateRangeMappings.map(e => (
    <option value={e.value}>{e.title}</option>
  ));

  const dateRangeBeyondOptionElements = DateRangeBeyondMappings.map(e => (
    <option value={e.value}>{e.title}</option>
  ));

  const sortOptionElements = SortMappings.map(e => (
    <option value={e.value}>{e.title}</option>
  ));

  return (
    <MainContainer>
      <h1 className="mb-2 text-lg">Advanced Search</h1>
      <Formik initialValues={intialValues} onSubmit={onSubmit}>
        {({}) => (
          <Form className="flex w-full flex-col p-2">
            <Field
              name="searchText"
              type="text"
              placeholder="Search for Stories"
              className="mb-4 border-2 border-slate-700"
            />
            <label htmlFor="searchFields">Search Fields:</label>
            <Field
              as="select"
              name="searchFields"
              multiple
              className="h-18 mb-2 border-2 border-slate-700"
            >
              {searchFieldOptionElements}
            </Field>
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
            <label htmlFor="searchCategories">Categories:</label>
            <Field
              as="select"
              name="searchCategories"
              multiple
              className="mb-2 border-2 border-slate-700"
            >
              <option value="__all__">All Categories</option>
              {categoryElements}
            </Field>
            <label htmlFor="sort">Sort:</label>
            <Field
              as="select"
              name="sort"
              className="mb-2 border-2 border-slate-700"
            >
              {sortOptionElements}
            </Field>
            <label htmlFor="searchAuthorName">Author's Name:</label>
            <Field
              name="searchAuthorName"
              type="text"
              className="mb-4 border-2 border-slate-700"
            />
            <button type="submit" className="w-1/2 rounded bg-red-500">
              Search
            </button>
          </Form>
        )}
      </Formik>
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
