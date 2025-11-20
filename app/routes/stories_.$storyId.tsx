import {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Link,
  ShouldRevalidateFunction,
  useLoaderData,
} from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { getStoryWithUser } from '~/api/facade/story-with-user.http';
import { getChapters } from '~/api/http/chapter.http';
import { getSessionId } from '~/api/sessionid.lib';
import { allPages } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
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
  const cookieHeader = request.headers.get('Cookie');
  let sessionId: string | null;
  if (cookieHeader !== null) {
    sessionId = getSessionId(cookieHeader);
  } else {
    sessionId = null;
  }

  const storyId = params.storyId as string;
  const queryClient = new QueryClient();

  const [story] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['story:withUser', storyId],
      queryFn: () =>
        getStoryWithUser(process.env.API_HOST as string, storyId, sessionId),
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

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

interface Props {
  storyId: string;
}

const View: React.FC<Props> = ({ storyId }) => {
  const { data: configService } = useConfig();

  const { data: story } = useQuery({
    queryKey: ['story:withUser', storyId],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStoryWithUser(host, storyId, null);
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
    enabled: configService !== undefined,
  });

  const chapterElements = chapters?.map((chapter, index) => (
    <div
      key={chapter.uuid}
      className="mb-2 flex w-full flex-row rounded-sm bg-sky-100 p-2"
    >
      <div className="flex flex-col">
        <div>
          <Link to={`/stories/${storyId}/${index}`} className="text-red-500">
            {chapter.name}
          </Link>
        </div>
        <div className="text-sm">
          {chapter.synopsis !== '' ? chapter.synopsis : story?.synopsis}
        </div>
      </div>
    </div>
  ));

  if (story === undefined) {
    return <MainContainer>Loading...</MainContainer>;
  }

  return (
    <MainContainer>
      <h1 className="mb-2 text-lg">{story.title}</h1>
      <div className="mb-2">
        by{' '}
        <Link to={`/user/${story.userUuid}`} className="text-red-500">
          {story.username}
        </Link>
      </div>
      <div className="mb-2">{story.synopsis}</div>
      <div className="h-1 w-full bg-slate-700" />
      <div className="mt-2 mb-4 text-lg">Chapters</div>
      <div className="w-full text-slate-800">{chapterElements}</div>
    </MainContainer>
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
