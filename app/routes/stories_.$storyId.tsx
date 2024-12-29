import { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { getChapters } from '~/api/http/chapter.http';
import { getStory } from '~/api/http/story.http';
import { getSessionId } from '~/api/sessionid.lib.server';
import { allPages } from '~/api/utils.lib';
import { useConfig } from '~/hooks/use-config';

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
      queryKey: ['story', storyId],
      queryFn: () =>
        getStory(process.env.API_HOST as string, storyId, sessionId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['story', storyId, 'chapters'],
      queryFn: () =>
        allPages((limit, offset) =>
          getChapters(process.env.API_HOST as string, storyId, sessionId, {
            limit,
            offset,
          }),
        ),
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
    queryKey: ['story', storyId],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStory(host, storyId, null);
    },
    enabled: configService !== undefined,
  });

  const { data: chapters } = useQuery({
    queryKey: ['story', storyId, 'chapters'],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return allPages((limit, offset) =>
        getChapters(host, storyId, null, { limit, offset }),
      );
    },
  });

  const chapterElements = chapters?.map((chapter, index) => (
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

View.propTypes = {
  storyId: PropTypes.string.isRequired,
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
