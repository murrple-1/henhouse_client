import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';

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
  TITLE,
  SYNOPSIS,
  STORY_TEXT,
  TAGS,
}

enum DateRange {
  ANY,
  ONE_WEEK,
  ONE_MONTH,
  THREE_MONTH,
  SIX_MONTH,
  ONE_YEAR,
}

enum DateRangeBeyond {
  AND_OLDER,
  AND_NEWER,
}

enum Sort {
  ALPHABETICAL,
  RELEVANCY,
  DATE,
  SCORE,
  NUM_COMMENTS,
}

const View: React.FC = () => {
  const navigate = useNavigate();

  const { data: configService } = useConfig();

  const [searchText, setSearchText] = useState('');
  const [searchFields, setSearchFields] = useState<SearchField[]>(() => [
    SearchField.TITLE,
  ]);
  const [searchDateRange, setSearchDateRange] = useState(DateRange.ANY);
  const [searchDateRangeBeyond, setSearchDateRangeBeyond] = useState(
    DateRangeBeyond.AND_OLDER,
  );
  const [searchCategories, setSearchCategories] = useState<string[]>([
    '__all__',
  ]);
  const [sort, setSort] = useState(Sort.ALPHABETICAL);
  const [searchAuthorName, setSearchAuthorName] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      allPages((limit, offset) =>
        getCategories(process.env.API_HOST as string, { limit, offset }, null),
      ),
    enabled: configService !== undefined,
  });

  const searchFieldValues = useMemo(() => {
    return searchFields.map(field => {
      switch (field) {
        case SearchField.TITLE: {
          return 'title';
        }
        case SearchField.SYNOPSIS: {
          return 'synopsis';
        }
        case SearchField.STORY_TEXT: {
          return 'story_text';
        }
        case SearchField.TAGS: {
          return 'tags';
        }
        default: {
          throw new Error('unknown search field');
        }
      }
    });
  }, [searchFields]);

  const searchDateRangeValues = useMemo(() => {
    switch (searchDateRange) {
      case DateRange.ANY: {
        return 'any';
      }
      case DateRange.ONE_WEEK: {
        return '1w';
      }
      case DateRange.ONE_MONTH: {
        return '1M';
      }
      case DateRange.THREE_MONTH: {
        return '3M';
      }
      case DateRange.SIX_MONTH: {
        return '6M';
      }
      case DateRange.ONE_YEAR: {
        return '1Y';
      }
      default: {
        throw new Error('unknown search date range');
      }
    }
  }, [searchDateRange]);

  const searchDateRangeBeyondValues = useMemo(() => {
    switch (searchDateRangeBeyond) {
      case DateRangeBeyond.AND_OLDER: {
        return 'older';
      }
      case DateRangeBeyond.AND_NEWER: {
        return 'newer';
      }
      default: {
        throw new Error('unknown search date range beyond');
      }
    }
  }, [searchDateRangeBeyond]);

  const sortValue = useMemo(() => {
    switch (sort) {
      case Sort.ALPHABETICAL: {
        return 'alphabetical';
      }
      case Sort.RELEVANCY: {
        return 'relevancy';
      }
      case Sort.DATE: {
        return 'date';
      }
      case Sort.SCORE: {
        return 'score';
      }
      case Sort.NUM_COMMENTS: {
        return 'num_comments';
      }
      default: {
        throw new Error('unknown sort');
      }
    }
  }, [sort]);

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const onSearchFieldsChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSearchFields(
        Array.from(e.target.selectedOptions, option => {
          switch (option.value) {
            case 'title': {
              return SearchField.TITLE;
            }
            case 'synopsis': {
              return SearchField.SYNOPSIS;
            }
            case 'story_text': {
              return SearchField.STORY_TEXT;
            }
            case 'tags': {
              return SearchField.TAGS;
            }
            default: {
              throw new Error('unknown search field');
            }
          }
        }),
      );
    },
    [setSearchFields],
  );

  const onSearchDateRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      switch (e.target.value) {
        case 'any': {
          setSearchDateRange(DateRange.ANY);
          break;
        }
        case '1w': {
          setSearchDateRange(DateRange.ONE_WEEK);
          break;
        }
        case '1M': {
          setSearchDateRange(DateRange.ONE_MONTH);
          break;
        }
        case '3M': {
          setSearchDateRange(DateRange.THREE_MONTH);
          break;
        }
        case '6M': {
          setSearchDateRange(DateRange.SIX_MONTH);
          break;
        }
        case '1Y': {
          setSearchDateRange(DateRange.ONE_YEAR);
          break;
        }
        default: {
          throw new Error('unknown search date range');
        }
      }
    },
    [setSearchDateRange],
  );

  const onSearchDateRangeBeyondChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      switch (e.target.value) {
        case 'older': {
          setSearchDateRangeBeyond(DateRangeBeyond.AND_OLDER);
          break;
        }
        case 'newer': {
          setSearchDateRangeBeyond(DateRangeBeyond.AND_NEWER);
          break;
        }
        default: {
          throw new Error('unknown search date range beyond');
        }
      }
    },
    [setSearchDateRangeBeyond],
  );

  const onSearchCategoriesChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSearchCategories(
        Array.from(e.target.selectedOptions, option => option.value),
      );
    },
    [setSearchCategories],
  );

  const onSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      switch (e.target.value) {
        case 'alphabetical': {
          setSort(Sort.ALPHABETICAL);
          break;
        }
        case 'relevancy': {
          setSort(Sort.RELEVANCY);
          break;
        }
        case 'date': {
          setSort(Sort.DATE);
          break;
        }
        case 'score': {
          setSort(Sort.SCORE);
          break;
        }
        case 'num_comments': {
          setSort(Sort.NUM_COMMENTS);
          break;
        }
        default: {
          throw new Error('unknown sort');
        }
      }
    },
    [setSort],
  );

  const onSearchAuthorNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchAuthorName(e.target.value);
    },
    [setSearchAuthorName],
  );

  const onSearch = useCallback(() => {
    const params: QueryParams = {};

    const searchText_ = searchText.trim();
    if (searchFields.includes(SearchField.TITLE)) {
      params['searchTitle'] = searchText_;
    }

    if (searchFields.includes(SearchField.SYNOPSIS)) {
      params['searchSynopsis'] = searchText_;
    }
    if (searchFields.includes(SearchField.STORY_TEXT)) {
      params['searchStoryText'] = searchText_;
    }

    if (searchFields.includes(SearchField.TAGS)) {
      params['searchTags'] = searchText_;
    }

    switch (searchDateRange) {
      case DateRange.ANY: {
        break;
      }
      case DateRange.ONE_WEEK: {
        switch (searchDateRangeBeyond) {
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
        switch (searchDateRangeBeyond) {
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
        switch (searchDateRangeBeyond) {
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
        switch (searchDateRangeBeyond) {
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
        switch (searchDateRangeBeyond) {
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

    if (!searchCategories.includes('__all__')) {
      params['searchCategories'] = searchCategories.join(',');
    }

    params['sort'] = sortValue;

    const searchAuthorName_ = searchAuthorName.trim();
    if (searchAuthorName_) {
      params['searchAuthorName'] = searchAuthorName_;
    }

    navigate(`/stories${generateQueryString(params)}`);
  }, [
    navigate,
    searchText,
    searchFields,
    searchDateRange,
    searchDateRangeBeyond,
    searchCategories,
    sort,
    searchAuthorName,
  ]);

  const categoryElements = categories?.map(category => (
    <option key={category.name} value={category.name}>
      {category.prettyName}
    </option>
  ));

  return (
    <MainContainer>
      <h1 className="mb-2 text-lg">Advanced Search</h1>
      <div className="flex w-full flex-col p-2">
        <input
          value={searchText ?? ''}
          onChange={onSearchTextChange}
          placeholder="Search for Stories"
          className="mb-4 border-2 border-slate-700"
        />
        <div>Search Fields:</div>
        <select
          multiple
          value={searchFieldValues}
          onChange={onSearchFieldsChange}
          className="h-18 mb-2 border-2 border-slate-700"
        >
          <option value="title">Title</option>
          <option value="synopsis">Synopsis</option>
          <option value="story_text">Story Text</option>
          <option value="tags">Tags</option>
        </select>
        <div>Date Range:</div>
        <div className="mb-2 flex flex-row">
          <select
            value={searchDateRangeValues}
            onChange={onSearchDateRangeChange}
            className="mr-2 flex-grow border-2 border-slate-700"
          >
            <option value="any">Any</option>
            <option value="1w">One Week</option>
            <option value="1M">One Month</option>
            <option value="3M">Three Months</option>
            <option value="6M">Six Months</option>
            <option value="1Y">One Year</option>
          </select>
          <select
            value={searchDateRangeBeyondValues}
            onChange={onSearchDateRangeBeyondChange}
            className="flex-grow border-2 border-slate-700"
          >
            <option value="older">And Older</option>
            <option value="newer">And Newer</option>
          </select>
        </div>
        <div>Categories:</div>
        <select
          multiple
          value={searchCategories}
          onChange={onSearchCategoriesChange}
          className="mb-2 border-2 border-slate-700"
        >
          <option value="__all__">All Categories</option>
          {categoryElements}
        </select>
        <div>Sort:</div>
        <select
          value={sortValue}
          onChange={onSortChange}
          className="mb-2 border-2 border-slate-700"
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="relevancy">Relevancy</option>
          <option value="date">Date</option>
          <option value="score">Score</option>
          <option value="num_comments"># of Comments</option>
        </select>
        <div>Author's Name:</div>
        <input
          value={searchAuthorName}
          onChange={onSearchAuthorNameChange}
          className="mb-4 border-2 border-slate-700"
        />
        <button
          type="button"
          onClick={onSearch}
          className="w-1/2 rounded bg-red-500"
        >
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
