import { faBook } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
  TypedResponse,
} from '@remix-run/node';
import {
  Link,
  ShouldRevalidateFunction,
  redirect,
  useLoaderData,
  useNavigate,
} from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useCallback, useContext, useMemo } from 'react';

import { getCSRFToken } from '~/api/csrftoken.lib';
import { getStoryChapter, updateChapter } from '~/api/http/chapter.http';
import { getSessionId } from '~/api/sessionid.lib';
import { MainContainer } from '~/components/main-container';
import { AlertsContext } from '~/contexts/alerts';
import { IsLoggedInContext } from '~/contexts/is-logged-in';
import { useConfig } from '~/hooks/use-config';
import { handleError } from '~/libs/http-error';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
  storyId: string;
  chapterNum: number;
}

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData | TypedResponse> => {
  const cookieHeader = request.headers.get('Cookie');
  let sessionId: string | null;
  if (cookieHeader !== null) {
    sessionId = getSessionId(cookieHeader);
  } else {
    sessionId = null;
  }

  if (!sessionId) {
    const url = new URL(request.url);
    return redirect(
      `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`,
    );
  }

  const storyId = params.storyId as string;
  const chapterNum = parseInt(params.chapterNum as string, 10);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['story', storyId, 'chapter', chapterNum],
    queryFn: () =>
      getStoryChapter(
        process.env.API_HOST as string,
        storyId,
        chapterNum,
        sessionId,
      ),
  });

  return {
    dehydratedState: dehydrate(queryClient),
    storyId,
    chapterNum,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

interface Props {
  storyId: string;
  chapterNum: number;
}

interface FormValues {
  name: string;
  synopsis: string;
  markdown: string;
}

const View: React.FC<Props> = ({ storyId, chapterNum }) => {
  const navigate = useNavigate();

  const isLoggedInContext = useContext(IsLoggedInContext);
  const alertsContext = useContext(AlertsContext);

  const { data: configService } = useConfig();

  const { data: chapter } = useQuery({
    queryKey: ['story', storyId, 'chapter', chapterNum],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getStoryChapter(host, storyId, chapterNum, null);
    },
  });

  const initialValues = useMemo<FormValues>(
    () => ({
      name: chapter?.name ?? '',
      synopsis: chapter?.synopsis ?? '',
      markdown: chapter?.markdown ?? '',
    }),
    [chapter],
  );

  const validate = useCallback((values: FormValues) => {
    const errors: Record<string, string> = {};
    if (values.name.trim() === '') {
      errors.title = 'Required';
    }

    if (values.markdown.trim() === '') {
      errors.category = 'Required';
    }

    return errors;
  }, []);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (chapter === undefined) {
        throw new Error('chapter undefined');
      }

      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }

      const csrfToken = getCSRFToken(document.cookie);
      if (csrfToken === null) {
        throw new Error('csrfToken null');
      }

      const host = configService.get<string>('API_HOST') as string;
      try {
        await updateChapter(
          host,
          chapter.uuid,
          {
            name: values.name,
            synopsis: values.synopsis,
            markdown: values.markdown,
          },
          csrfToken,
          null,
        );
      } catch (error: unknown) {
        handleError(error, isLoggedInContext, alertsContext, navigate);
      }
      navigate(`/stories/${storyId}/edit`);
    },
    [configService, isLoggedInContext, alertsContext, navigate, storyId],
  );

  return (
    <MainContainer>
      <div className="flex flex-row justify-center">
        <Link to={`/stories/${storyId}/edit`} className="text-red-500">
          <FontAwesomeIcon icon={faBook} />
        </Link>
      </div>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid, dirty }) => (
          <Form className="flex w-full flex-col items-center p-2">
            <Field
              type="text"
              name="name"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Name"
            />
            <ErrorMessage
              name="name"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <Field
              type="text"
              name="synopsis"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Synopsis"
            />
            <ErrorMessage
              name="synopsis"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <Field
              type="textarea"
              name="markdown"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Content"
            />
            <ErrorMessage
              name="markdown"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <button
              type="submit"
              className="mt-2 w-1/2 rounded-sm dark:bg-red-500 dark:disabled:bg-red-800 dark:disabled:text-gray-500"
              disabled={!(isValid && dirty) || isSubmitting}
            >
              Save
            </button>
          </Form>
        )}
      </Formik>
    </MainContainer>
  );
};

const Index: React.FC = () => {
  const { dehydratedState, storyId, chapterNum } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View storyId={storyId} chapterNum={chapterNum} />
    </HydrationBoundary>
  );
};

export default Index;
