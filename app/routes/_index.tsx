import type {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";

import { getStories, SortField, Story } from "~/api/story.http";
import { QueryOptions } from "~/api/query.interface";
import { Page } from "~/api/utils.lib";
import { useState } from "react";
import { getSessionId } from "~/api/sessionid.lib.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

interface LoaderData {
  stories: Page<Story>;
}

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const url = new URL(request.url);

  const limitQuery = url.searchParams.get("limit");
  const offsetQuery = url.searchParams.get("offset");
  const searchQuery = url.searchParams.get("search");
  const sortQuery = url.searchParams.get("sort");

  const options: QueryOptions<SortField> = {};

  if (limitQuery !== null) {
    const limit = parseInt(limitQuery, 10);
    if (!isNaN(limit)) {
      options.limit = limit;
    }
  }

  if (offsetQuery !== null) {
    const offset = parseInt(offsetQuery, 10);
    if (!isNaN(offset)) {
      options.offset = offset;
    }
  }

  if (searchQuery !== null) {
    options.search = searchQuery;
  }

  if (sortQuery !== null) {
    options.sort = sortQuery;
  }

  const stories = await getStories(sessionId, options);

  return { stories };
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  console.log(JSON.stringify(loaderData));

  const [limit, setLimit] = useState<number | null>(null);
  const [searchTitle, setSearchTitle] = useState<string | null>(null);

  const storyTitleElements = loaderData.stories.items.map((s, i) => (
    <div key={`storyTitles-${i}`}>{s.title}</div>
  ));

  return (
    <>
      <div>
        <input
          name="limit"
          type="number"
          value={limit !== null ? limit.toString(10) : ""}
          onChange={(e) => setLimit(parseInt(e.target.value))}
        />
        <input
          name="searchText"
          value={searchTitle !== null ? searchTitle : ""}
          onChange={(e) => setSearchTitle(e.target.value)}
        />
        <button type="button">Search</button>
      </div>
      {storyTitleElements}
    </>
  );
}
