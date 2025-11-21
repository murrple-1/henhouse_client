import { faGear, faX } from '@fortawesome/free-solid-svg-icons';
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
  useQueryClient,
} from '@tanstack/react-query';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import PropTypes from 'prop-types';
import { useCallback, useContext, useMemo, useState } from 'react';

import { getCSRFToken } from '~/api/csrftoken.lib';
import { getCategories } from '~/api/http/category.http';
import { deleteChapter, getChapters } from '~/api/http/chapter.http';
import { getStory, updateStory } from '~/api/http/story.http';
import { getSessionId } from '~/api/sessionid.lib';
import { allPages } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { Modal } from '~/components/modal';
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

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () =>
        allPages((limit, offset) =>
          getCategories(
            process.env.API_HOST as string,
            {
              limit,
              offset,
            },
            sessionId,
          ),
        ),
    }),
    queryClient.prefetchQuery({
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
            { limit, offset },
            null,
          ),
        ),
    }),
  ]);

  return {
    dehydratedState: dehydrate(queryClient),
    storyId,
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

interface Props {
  storyId: string;
}

interface FormValues {
  title: string;
  synopsis: string;
  category: string;
  tagsString: string;
}

const View: React.FC<Props> = ({ storyId }) => {
  const navigate = useNavigate();

  const isLoggedInContext = useContext(IsLoggedInContext);
  const alertsContext = useContext(AlertsContext);

  const { data: configService } = useConfig();

  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configService undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return allPages((limit, offset) =>
        getCategories(
          host,
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
    enabled: configService !== undefined,
  });

  const [isDeleteChapterModalOpen, setIsDeleteChapterModalOpen] =
    useState(false);

  const [deleteChapterUuid, setDeleteChapterUuid] = useState<string | null>(
    null,
  );

  const onDeleteChapterModalRequestClose = useCallback(() => {
    setIsDeleteChapterModalOpen(false);
  }, [setIsDeleteChapterModalOpen]);

  const onDeleteChapterModalYesClick = useCallback(async () => {
    if (configService === undefined) {
      throw new Error('configSerive undefined');
    }

    const csrfToken = getCSRFToken(document.cookie);
    if (csrfToken === null) {
      throw new Error('csrfToken null');
    }

    if (chapters === undefined) {
      throw new Error('chapters undefined');
    }

    if (deleteChapterUuid === null) {
      throw new Error('deleteChapterUuid null');
    }

    const host = configService.get<string>('API_HOST') as string;

    try {
      await deleteChapter(host, deleteChapterUuid, csrfToken, null);
    } catch (error: unknown) {
      handleError(error, isLoggedInContext, alertsContext, navigate);
      return;
    }
    queryClient.setQueryData(
      ['story', storyId, 'chapters'],
      chapters.filter(chapter => chapter.uuid !== deleteChapterUuid),
    );
    setDeleteChapterUuid(null);
    setIsDeleteChapterModalOpen(false);
  }, [
    isLoggedInContext,
    alertsContext,
    navigate,
    configService,
    setIsDeleteChapterModalOpen,
    chapters,
    deleteChapterUuid,
    queryClient,
    storyId,
  ]);

  const initialValues = useMemo<FormValues>(
    () => ({
      title: story?.title ?? '',
      synopsis: story?.synopsis ?? '',
      category: story?.category ?? '',
      tagsString: story?.tags.join(', ') ?? '',
    }),
    [story],
  );

  const validate = useCallback((values: FormValues) => {
    const errors: Record<string, string> = {};
    if (values.title.trim() === '') {
      errors.title = 'Required';
    }

    if (values.synopsis.trim() === '') {
      errors.synopsis = 'Required';
    }

    if (values.category.trim() === '') {
      errors.category = 'Required';
    }

    return errors;
  }, []);

  const onSubmit = useCallback(
    async (values: FormValues, actions: FormikHelpers<FormValues>) => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }

      const csrfToken = getCSRFToken(document.cookie);
      if (csrfToken === null) {
        throw new Error('csrfToken null');
      }

      const host = configService.get<string>('API_HOST') as string;
      try {
        await updateStory(
          host,
          storyId,
          {
            // TODO implement
          },
          csrfToken,
          null,
        );
      } catch (error: unknown) {
        handleError(error, isLoggedInContext, alertsContext, navigate);
      }
      actions.setSubmitting(false);
    },
    [configService, isLoggedInContext, alertsContext, navigate, storyId],
  );

  if (story === undefined) {
    return <div>Loading...</div>;
  }

  let categoryOptions: React.ReactElement[] | null;
  if (categories !== undefined) {
    categoryOptions = categories.map(category => (
      <option key={`categoryOptions-${category.name}`} value={category.name}>
        {category.prettyName}
      </option>
    ));
  } else {
    categoryOptions = null;
  }

  const chapterElements = chapters?.map((chapter, index) => (
    <div
      key={chapter.uuid}
      className="mb-2 flex w-full flex-row rounded-sm bg-sky-100 p-2"
    >
      <div className="flex grow flex-col">
        <div>
          <Link
            to={`/stories/${storyId}/${index}/edit`}
            className="text-red-500"
          >
            {chapter.name}
          </Link>
        </div>
        <div className="text-sm">
          {chapter.synopsis !== '' ? chapter.synopsis : story?.synopsis}
        </div>
      </div>
      <div className="ml-32 flex flex-col">
        <div className="flex flex-row justify-end">
          <Link to={`/stories/${storyId}/${index}/edit`}>
            <FontAwesomeIcon icon={faGear} height="1em" />
          </Link>
          <div role="button" className="ml-2">
            <FontAwesomeIcon
              icon={faX}
              height="1em"
              onClick={() => {
                setDeleteChapterUuid(chapter.uuid);
                setIsDeleteChapterModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  ));

  return (
    <>
      <MainContainer>
        <Formik
          initialValues={initialValues}
          onSubmit={onSubmit}
          validate={validate}
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="flex w-full flex-col items-center p-2">
              <Field
                type="text"
                name="title"
                className="w-1/2 border-2 border-slate-700"
                placeholder="Title"
              />
              <ErrorMessage
                name="title"
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
                as="select"
                name="category"
                className="w-1/2 border-2 border-slate-700"
              >
                {categoryOptions}
              </Field>
              <ErrorMessage
                name="category"
                component="div"
                className="text-red-600"
              />
              <div className="h-2" />
              <Field
                type="text"
                name="tagsString"
                className="w-1/2 border-2 border-slate-700"
                placeholder="Tags"
              />
              <ErrorMessage
                name="tagsString"
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
              <button
                type="button"
                className="mt-2 w-1/2 rounded-sm dark:bg-red-500 dark:disabled:bg-red-800 dark:disabled:text-gray-500"
              >
                Delete
              </button>
            </Form>
          )}
        </Formik>
        <div className="h-1 w-full bg-slate-700" />
        <div className="mt-2 mb-4 text-lg">Chapters</div>
        <Link
          to={`/stories/${storyId}/chapter/create`}
          className="text-red-500"
        >
          Add Chapter
        </Link>
        <div className="w-full text-slate-800">{chapterElements}</div>
      </MainContainer>
      <Modal
        isOpen={isDeleteChapterModalOpen}
        onRequestClose={onDeleteChapterModalRequestClose}
        contentLabel="Delete Chapter Modal"
      >
        <div>Are you sure you want to delete?</div>
        <div className="mt-2 flex flex-row">
          <button
            className="w-24 rounded-sm dark:bg-red-500"
            onClick={onDeleteChapterModalYesClick}
          >
            Yes
          </button>
          <span className="grow" />
          <button
            className="w-24 rounded-sm dark:bg-red-500"
            onClick={onDeleteChapterModalRequestClose}
          >
            No
          </button>
        </div>
      </Modal>
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
