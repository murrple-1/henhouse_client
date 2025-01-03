import {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
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

import { getChapter, getChapters } from '~/api/http/chapter.http';
import { getStory } from '~/api/http/story.http';
import { getSessionId } from '~/api/sessionid.lib.server';
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
  chapterId: string | null;
  storyTitle: string | null;
  chapterName: string | null;
}

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const sessionId = getSessionId(request);

  const storyId = params.storyId as string;
  const chapterNum = parseInt(params.chapterNum as string, 10);

  const queryClient = new QueryClient();

  const [story, chapters] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['story', storyId],
      queryFn: () =>
        getStory(process.env.API_HOST as string, storyId, sessionId),
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

  const chapterId = chapters[chapterNum]?.uuid ?? null;

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
  };
};

interface Props {
  chapterId: string | null;
}

const View: React.FC<Props> = ({ chapterId }) => {
  const { data: configService } = useConfig();
  const { data: chapter, isPending } = useQuery({
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

  if (isPending) {
    return <MainContainer>Loading...</MainContainer>;
  } else if (chapter === undefined) {
    return <MainContainer>Error</MainContainer>;
  } else {
    return (
      <MainContainer>
        <div dangerouslySetInnerHTML={{ __html: markdownHtml as string }} />
      </MainContainer>
    );
  }
};

export default function Index() {
  const { dehydratedState, chapterId } = useLoaderData<LoaderData>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <View chapterId={chapterId} />
    </HydrationBoundary>
  );
}
