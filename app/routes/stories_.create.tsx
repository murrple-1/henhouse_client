import {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
  TypedResponse,
} from '@remix-run/node';
import { redirect, useLoaderData, useNavigate } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useCallback, useContext, useMemo } from 'react';

import { getCSRFToken } from '~/api/csrftoken.lib';
import { getCategories } from '~/api/http/category.http';
import { createStory } from '~/api/http/story.http';
import { getSessionId } from '~/api/sessionid.lib';
import { allPages } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { AlertsContext } from '~/contexts/alerts';
import { IsLoggedInContext } from '~/contexts/is-logged-in';
import { useConfig } from '~/hooks/use-config';
import { handleError } from '~/libs/http-error';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server - Create Story' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
}

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData | TypedResponse> => {
  const cookieHeader = request.headers.get('Cookie');
  let sessionId: string | null;
  if (cookieHeader !== null) {
    sessionId = getSessionId(cookieHeader);
  } else {
    sessionId = null;
  }

  if (!sessionId) {
    return redirect('/login');
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
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
  });

  return {
    dehydratedState: dehydrate(queryClient),
  };
};

interface FormValues {
  title: string;
  synopsis: string;
  category: string;
  tagsString: string;
}

const View: React.FC = () => {
  const { data: configService } = useConfig();
  const navigate = useNavigate();

  const isLoggedInContext = useContext(IsLoggedInContext);
  const alertsContext = useContext(AlertsContext);

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

  const initialValues = useMemo<FormValues>(
    () => ({
      title: '',
      synopsis: '',
      category: categories?.[0]?.name ?? '',
      tagsString: '',
    }),
    [categories],
  );

  const validate = useCallback((values: FormValues) => {
    const errors: Record<string, string> = {};
    if (values.title.trim() === '') {
      errors.usernameEmail = 'Required';
    }

    return errors;
  }, []);

  const onSubmit = useCallback(
    async (values: FormValues, actions: FormikHelpers<FormValues>) => {
      if (isLoggedInContext === null) {
        throw new Error('isLoggedInContext null');
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
        const story = await createStory(
          host,
          {
            title: values.title,
            synopsis: values.synopsis,
            category: values.category,
            tags: values.tagsString
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag !== ''),
          },
          csrfToken,
          null,
        );

        navigate(`/stories/${story.uuid}/edit`);
      } catch (error: unknown) {
        handleError(error, isLoggedInContext, alertsContext, navigate);
      }
      actions.setSubmitting(false);
    },
    [navigate, configService, alertsContext, isLoggedInContext],
  );

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

  return (
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
              Create
            </button>
          </Form>
        )}
      </Formik>
    </MainContainer>
  );
};

const Index: React.FC = () => {
  const { dehydratedState } = useLoaderData<LoaderData>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <View />
    </HydrationBoundary>
  );
};

export default Index;
