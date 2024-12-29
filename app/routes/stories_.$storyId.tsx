import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { getChapters } from "~/api/http/chapter.http";

import { getStory } from "~/api/http/story.http";
import { getSessionId } from "~/api/sessionid.lib.server";
import { useConfig } from "~/hooks/use-config";

interface LoaderData {
  dehydratedState: DehydratedState;
  storyId: string;
}

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const storyId = params.storyId as string;
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["story", storyId],
      queryFn: () =>
        getStory(process.env.API_HOST as string, storyId, sessionId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["story", storyId, "chapters"],
      queryFn: () =>
        getChapters(process.env.API_HOST as string, storyId, sessionId),
    }),
  ]);

  return {
    storyId,
    dehydratedState: dehydrate(queryClient),
  };
};

interface Props {
  storyId: string;
}

const View: React.FC<Props> = ({ storyId }) => {
  const { data: configService } = useConfig();

  const { data: story } = useQuery({
    queryKey: ["story", storyId],
    queryFn: () =>
      getStory(configService?.get<string>("API_HOST") as string, storyId, null),
    enabled: configService !== undefined,
  });

  const { data: chapters } = useQuery({
    queryKey: ["story", storyId, "chapters"],
    queryFn: () =>
      getChapters(
        configService?.get<string>("API_HOST") as string,
        storyId,
        null,
      ),
  });

  const chapterElements = chapters?.items.map((chapter, index) => (
    <div key={chapter.uuid}>
      <Link to={`/stories/${storyId}/${index}`}>{chapter.name}</Link>
    </div>
  ));

  if (story === undefined) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <div>{story.title}</div>
      {chapterElements}
    </>
  );
};

const Index: React.FC = () => {
  const { dehydratedState, storyId } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View storyId={storyId} />
    </HydrationBoundary>
  );
};

export default Index;
