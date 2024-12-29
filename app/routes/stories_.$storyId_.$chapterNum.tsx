import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React from "react";
import { getChapter, getChapters } from "~/api/http/chapter.http";

import { getSessionId } from "~/api/sessionid.lib.server";

interface LoaderData {
  dehydratedState: DehydratedState;
  chapterId: string | null;
}

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const storyId = params.storyId as string;
  const chapterNum = parseInt(params.chapterNum as string, 10);

  const queryClient = new QueryClient();

  const chapters = await queryClient.fetchQuery({
    queryKey: ["story", storyId, "chapters"],
    queryFn: () =>
      getChapters(process.env.API_HOST as string, storyId, sessionId),
  });

  const chapterId = chapters.items[chapterNum]?.uuid ?? null;

  if (chapterId !== null) {
    await queryClient.prefetchQuery({
      queryKey: ["chapter", chapterId],
      queryFn: () =>
        getChapter(process.env.API_HOST as string, chapterId, sessionId),
    });
  }

  return {
    chapterId,
    dehydratedState: dehydrate(queryClient),
  };
};

interface Props {
  chapterId: string | null;
}

const View: React.FC<Props> = ({ chapterId }) => {
  return <div>Stories/storyId/chapterNum: {chapterId}</div>;
};

export default function Index() {
  const { dehydratedState, chapterId } = useLoaderData<LoaderData>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <View chapterId={chapterId} />
    </HydrationBoundary>
  );
}
