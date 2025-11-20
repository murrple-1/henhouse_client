import {
  faArrowLeft,
  faArrowRight,
  faBook,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import insaneSanitize from 'insane';
import { parse as markedParse } from 'marked';
import React, { useEffect } from 'react';

import { getStoryWithUser } from '~/api/facade/story-with-user.http';
import { getChapter, getChapters } from '~/api/http/chapter.http';
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
    { title: `Henhouse Server - ${data.storyTitle} - ${data.chapterName}` },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
  storyId: string;
  chapterId: string | null;
  storyTitle: string | null;
  chapterName: string | null;
  chapterNumber: number;
  totalChapters: number;
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
  const chapterNumber = parseInt(params.chapterNum as string, 10);

  const queryClient = new QueryClient();

  const [story, chapters] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['story:withUser', storyId],
      queryFn: () =>
        getStoryWithUser(process.env.API_HOST as string, storyId, sessionId),
    }),
    queryClient.fetchQuery({
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

  const chapterId = chapters[chapterNumber]?.uuid ?? null;

  let chapterName: string | null = null;
  if (chapterId !== null) {
    const chapter = await queryClient.fetchQuery({
      queryKey: ['chapter', chapterId],
      queryFn: () =>
        getChapter(process.env.API_HOST as string, chapterId, sessionId),
    });
    chapterName = chapter.name;
  }

  return {
    dehydratedState: dehydrate(queryClient),
    chapterId,
    storyTitle: story.title,
    chapterName,
    storyId,
    chapterNumber,
    totalChapters: chapters.length,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

interface Props {
  storyId: string;
  chapterId: string | null;
  chapterNumber: number;
  totalChapters: number;
}

const View: React.FC<Props> = ({
  chapterId,
  storyId,
  chapterNumber,
  totalChapters,
}) => {
  const { data: configService } = useConfig();
  const { data: story, isPending: storyIsPending } = useQuery({
    queryKey: ['story:withUser', storyId],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStoryWithUser(host, storyId, null);
    },
    enabled: configService !== undefined && chapterId !== null,
  });

  const { data: chapter, isPending: chpaterIsPending } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      if (chapterId === null) {
        throw new Error('chapterId null');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getChapter(host, chapterId, null);
    },
    enabled: configService !== undefined && chapterId !== null,
  });

  const [markdownHtml, setMarkdownHtml] = React.useState<string | null>(null);

  useEffect(() => {
    const chapter_ = chapter;
    if (chapter_ === undefined) {
      return;
    }

    async function prepMarkdown() {
      if (chapter_ === undefined) {
        return;
      }
      setMarkdownHtml(null);
      const res = insaneSanitize(await markedParse(chapter_.markdown));
      if (!active) {
        return;
      }
      setMarkdownHtml(res);
    }

    let active = true;
    prepMarkdown();
    return () => {
      active = false;
    };
  }, [chapter, setMarkdownHtml]);

  let nextElement: React.ReactElement | null;
  if (chapterNumber < totalChapters - 1) {
    nextElement = (
      <Link
        to={`/stories/${storyId}/${chapterNumber + 1}`}
        className="ml-2 text-red-500"
      >
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
    );
  } else {
    nextElement = null;
  }

  let previousElement: React.ReactElement | null;
  if (chapterNumber > 0) {
    previousElement = (
      <Link
        to={`/stories/${storyId}/${chapterNumber - 1}`}
        className="mr-2 text-red-500"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </Link>
    );
  } else {
    previousElement = null;
  }

  if (storyIsPending || chpaterIsPending) {
    return <MainContainer>Loading...</MainContainer>;
  } else if (
    story === undefined ||
    chapter === undefined ||
    markdownHtml === null
  ) {
    return <MainContainer>Error</MainContainer>;
  } else {
    return (
      <MainContainer>
        <h1 className="mb-2 text-lg">{story.title}</h1>
        <div className="mb-2">
          by{' '}
          <Link to={`/user/${story.userUuid}`} className="text-red-500">
            {story.username}
          </Link>
        </div>
        <div className="mb-2 flex flex-row justify-center">
          {previousElement}
          <div>{chapter.name}</div>
          {nextElement}
        </div>
        <div className="flex flex-row justify-center">
          <Link to={`/stories/${storyId}`} className="text-red-500">
            <FontAwesomeIcon icon={faBook} />
          </Link>
        </div>
        <div
          className="[&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
        />
      </MainContainer>
    );
  }
};

export default function Index() {
  const { dehydratedState, chapterId, storyId, chapterNumber, totalChapters } =
    useLoaderData<LoaderData>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <View
        chapterId={chapterId}
        storyId={storyId}
        chapterNumber={chapterNumber}
        totalChapters={totalChapters}
      />
    </HydrationBoundary>
  );
}
