import {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
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

export const meta: MetaFunction<typeof loader> = ({
  data,
}: {
  data: LoaderData;
}) => {
  return [
    { title: `Henhouse Server - ${data.storyTitle}` },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
  storyId: string;
  storyTitle: string | null;
}

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const storyId = params.storyId as string;
  const queryClient = new QueryClient();

  const [story] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['story', storyId],
      queryFn: () =>
        getStory(process.env.API_HOST as string, storyId, sessionId),
    }),
    queryClient.prefetchQuery({
      queryKey: ['story', storyId, 'chapters'],
      queryFn: () =>
        allPages((limit, offset) =>
          getChapters(
            process.env.API_HOST as string,
            storyId,
            {
              limit,
              offset,
            },
            sessionId,
          ),
        ),
    }),
  ]);

  return {
    storyId,
    storyTitle: story.title,
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
        getChapters(host, storyId, { limit, offset }, null),
      );
    },
  });

  const chapterElements = chapters?.map((chapter, index) => (
    <div key={chapter.uuid}>
      <Link to={`/stories/${storyId}/${index}`}>{chapter.name}</Link>
    </div>
  ));

  if (story === undefined) {
    return <div className="container mx-auto px-4">Loading...</div>;
  }
  return (
    <div className="container mx-auto px-4">
      <div>{story.title}</div>
      {chapterElements}
    </div>
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
