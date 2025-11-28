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
  useParams,
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
import React, { useEffect, useMemo } from 'react';

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
  storyTitle: string | null;
  chapterName: string | null;
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
  if (isNaN(chapterNumber) || chapterNumber < 0) {
    throw new Response('not Found', { status: 404 });
  }

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

  console.log('chapters', chapters);
  console.log('chapterNumber', chapterNumber);

  const chapterId = chapters[chapterNumber]?.uuid ?? null;

  let chapterName: string | null = null;
  if (chapterId !== null) {
    const chapter = await queryClient.fetchQuery({
      queryKey: ['story', storyId, 'chapter', chapterId],
      queryFn: () =>
        getChapter(process.env.API_HOST as string, chapterId, sessionId),
    });
    chapterName = chapter.name;
  }

  return {
    dehydratedState: dehydrate(queryClient),
    storyTitle: story.title,
    chapterName,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
}) => {
  const currentStoryId = currentParams.storyId as string;
  const currentChapterNumber = currentParams.chapterNum as string;
  const nextStoryId = nextParams.storyId as string;
  const nextChapterNumber = nextParams.chapterNum as string;
  return (
    currentStoryId !== nextStoryId || currentChapterNumber !== nextChapterNumber
  );
};

const View: React.FC = () => {
  const params = useParams();

  const storyId = params.storyId as string;
  const chapterNumber = useMemo(() => {
    const chapterNum_ = parseInt(params.chapterNum as string, 10);
    if (isNaN(chapterNum_) || chapterNum_ < 0) {
      throw new Error('not Found');
    }
    return chapterNum_;
  }, [params]);

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
    enabled: configService !== undefined,
  });

  const { data: chapters, isPending: chaptersIsPending } = useQuery({
    queryKey: ['story', storyId, 'chapters'],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return allPages((limit, offset) =>
        getChapters(
          host,
          storyId,
          {
            limit,
            offset,
          },
          null,
        ),
      );
    },
    enabled: configService !== undefined,
  });

  const { data: chapter, isPending: chapterIsPending } = useQuery({
    queryKey: ['story', storyId, 'chapter', chapterNumber],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      if (chapters === undefined) {
        throw new Error('chapters undefined');
      }
      const chapterId = chapters[chapterNumber]?.uuid;
      if (chapterId === undefined) {
        throw new Error('chapterId undefined');
      }
      return getChapter(host, chapterId, null);
    },
    enabled: configService !== undefined && chapters !== undefined,
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
  if (chapters !== undefined && chapterNumber < chapters.length - 1) {
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

  if (storyIsPending || chaptersIsPending || chapterIsPending) {
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
  const { dehydratedState } = useLoaderData<LoaderData>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <View />
    </HydrationBoundary>
  );
}
