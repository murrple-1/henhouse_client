import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getStories, SortField } from "~/api/http/story.http";
import { QueryOptions } from "~/api/query.interface";
import React, { useCallback, useState } from "react";
import { getSessionId } from "~/api/sessionid.lib.server";
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useConfig } from "~/hooks/use-config";
import { Sort } from "~/api/sort.interface";

export const meta: MetaFunction = () => {
  return [
    { title: "Henhouse Server" },
    { name: "description", content: "Welcome to Henhouse!" },
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
    sort: new Sort([["title", "ASC"]]),
  };
}

interface LoaderData {
  dehydratedState: DehydratedState;
  limit: number | null;
  offset: number | null;
  search: string | null;
}

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const url = new URL(request.url);

  const limitQuery = url.searchParams.get("limit");
  const offsetQuery = url.searchParams.get("offset");
  const searchQuery = url.searchParams.get("search");

  let limit: number | null = null;
  let offset: number | null = null;
  let search: string | null = null;

  if (limitQuery !== null) {
    limit = parseInt(limitQuery, 10);
    if (isNaN(limit)) {
      limit = null;
    }
  }

  if (offsetQuery !== null) {
    offset = parseInt(offsetQuery, 10);
    if (isNaN(offset)) {
      offset = null;
    }
  }

  if (searchQuery !== null) {
    search = searchQuery;
  }

  const queryClient = new QueryClient();

  const options = generateSearchOptions(limit, offset, search);

  await queryClient.prefetchQuery({
    queryKey: ["stories", limit, offset, search],
    queryFn: () =>
      getStories(process.env.API_HOST as string, sessionId, options),
  });
  return {
    dehydratedState: dehydrate(queryClient),
    limit,
    offset,
    search,
  };
};

interface Props {
  initialLimit: number | null;
  initialOffset: number | null;
  initialSearchText: string | null;
}

const View: React.FC<Props> = ({
  initialLimit,
  initialOffset,
  initialSearchText,
}) => {
  const [limit, setLimit] = useState<number | null>(initialLimit);
  const [offset, setOffset] = useState<number | null>(initialOffset);
  const [searchText, setSearchText] = useState<string | null>(
    initialSearchText,
  );

  const [searchOptions, setSearchOptions] = useState<QueryOptions<SortField>>(
    () => generateSearchOptions(limit, offset, searchText),
  );

  const { data: configService } = useConfig();

  const { data: stories } = useQuery({
    queryKey: [
      "stories",
      searchOptions.limit,
      searchOptions.offset,
      searchOptions.search,
    ],
    queryFn: () =>
      getStories(
        configService?.get<string>("API_HOST") as string,
        null,
        searchOptions,
      ),
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

  const storyTitleElements = stories?.items.map((s, i) => (
    <div key={`storyTitles-${i}`}>{s.title}</div>
  ));

  return (
    <>
      <div>
        <input
          type="number"
          value={limit !== null ? limit.toString(10) : ""}
          onChange={onLimitChange}
        />
        <input
          type="number"
          value={offset !== null ? offset.toString(10) : ""}
          onChange={onOffsetChange}
        />
        <input value={searchText ?? ""} onChange={onSearchTextChange} />
        <button type="button" onClick={onSearch}>
          Search
        </button>
      </div>
      {storyTitleElements}
    </>
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
