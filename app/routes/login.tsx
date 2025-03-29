import { MetaFunction } from '@remix-run/node';
import { Link, useNavigate, useSearchParams } from '@remix-run/react';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useCallback, useMemo, useState } from 'react';

import { getCSRFToken } from '~/api/csrftoken.lib';
import { login } from '~/api/http/auth.http';
import { ResponseError } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface FormValues {
  usernameEmail: string;
  password: string;
  stayLoggedIn: boolean;
}

const Index: React.FC = () => {
  const [searchParams] = useSearchParams();

  const { data: configService } = useConfig();
  const navigate = useNavigate();

  const [generalError, setGeneralError] = useState<string | null>(null);

  const initialValues = useMemo<FormValues>(
    () => ({ usernameEmail: '', password: '', stayLoggedIn: false }),
    [],
  );

  const validate = useCallback((values: FormValues) => {
    const errors: Record<string, string> = {};
    if (values.usernameEmail.trim() === '') {
      errors.usernameEmail = 'Required';
    }

    if (values.password.trim() === '') {
      errors.password = 'Required';
    }
    return errors;
  }, []);

  const onSubmit = useCallback(
    async (values: FormValues, actions: FormikHelpers<FormValues>) => {
      setGeneralError(null);

      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const csrfToken = getCSRFToken(document.cookie);
      if (csrfToken === null) {
        throw new Error('csrfToken null');
      }
      const host = configService.get<string>('API_HOST') as string;
      try {
        await login(
          host,
          {
            usernameEmail: values.usernameEmail,
            password: values.password,
            stayLoggedIn: values.stayLoggedIn,
          },
          csrfToken,
        );

        // TODO GUI should change now that we are logged in

        const redirect = searchParams.get('redirect');
        if (redirect !== null) {
          if (redirect.startsWith('/') && !redirect.startsWith('//')) {
            navigate(redirect);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error: unknown) {
        let errorHandled = false;
        if (error instanceof ResponseError) {
          if (error.status === 401) {
            actions.setFieldError('password', 'Invalid username or password');
            errorHandled = true;
          }
        }

        if (!errorHandled) {
          console.error(error);
          setGeneralError('An unknown error has occurred. Please try again');
        }
      }
      actions.setSubmitting(false);
    },
    [navigate, configService, searchParams, setGeneralError],
  );

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
              name="usernameEmail"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Username or Email"
            />
            <ErrorMessage
              name="usernameEmail"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <Field
              type="password"
              name="password"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Password"
            />
            <ErrorMessage
              name="password"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <div className="flex flex-row">
              <label htmlFor="stayLoggedIn" className="mr-2">
                Stay Logged In?
              </label>
              <Field type="checkbox" id="stayLoggedIn" name="stayLoggedIn" />
            </div>
            <button
              type="submit"
              className="mt-2 w-1/2 rounded dark:bg-red-500 disabled:dark:bg-red-800 disabled:dark:text-gray-500"
              disabled={!(isValid && dirty) || isSubmitting}
            >
              Login
            </button>
          </Form>
        )}
      </Formik>
      {generalError && (
        <div className="mt-2 w-1/2 rounded bg-red-500 p-2 text-center text-white">
          {generalError}
        </div>
      )}
      <div>
        <Link to="/register" className="text-red-500">
          Register
        </Link>
      </div>
    </MainContainer>
  );
};

export default Index;
