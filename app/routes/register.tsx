import { MetaFunction } from '@remix-run/node';
import { Link, useNavigate } from '@remix-run/react';
import { validate as validateEmail } from 'email-validator';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useCallback, useContext, useMemo } from 'react';

import { getCSRFToken } from '~/api/csrftoken.lib';
import { register } from '~/api/http/auth.http';
import { ResponseError } from '~/api/utils.lib';
import { MainContainer } from '~/components/main-container';
import { AlertsContext } from '~/contexts/alerts';
import { useConfig } from '~/hooks/use-config';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface FormValues {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

const Index: React.FC = () => {
  const { data: configService } = useConfig();
  const navigate = useNavigate();

  const alertsContext = useContext(AlertsContext);

  const initialValues = useMemo<FormValues>(
    () => ({ username: '', email: '', password: '', passwordConfirm: '' }),
    [],
  );

  const validate = useCallback((values: FormValues) => {
    const errors: Record<string, string> = {};

    if (values.username.trim() === '') {
      errors.username = 'Required';
    }

    const email_ = values.email.trim();
    if (email_ === '') {
      errors.email = 'Required';
    } else if (!validateEmail(email_)) {
      errors.email = 'Invalid email';
    }

    if (values.password === '') {
      errors.password = 'Required';
    } else if (values.passwordConfirm === '') {
      errors.passwordConfirm = 'Required';
    } else if (values.password !== values.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
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
        await register(
          host,
          {
            username: values.username,
            email: values.email,
            password: values.password,
          },
          csrfToken,
        );

        navigate('/register/success');
      } catch (error: unknown) {
        let errorHandled = false;
        if (error instanceof ResponseError) {
          if (error.status === 409) {
            alertsContext.addAlert({
              type: 'error',
              message: 'Username or email already exists',
              removalInfo: {
                id: 'register:already-exists',
                timeout: 5000,
              },
            });
            errorHandled = true;
          }
        }

        if (!errorHandled) {
          console.error(error);
          alertsContext.addAlert({
            type: 'error',
            message: 'An unknown error has occurred. Please try again',
            removalInfo: {
              id: 'register:unknown-error',
              timeout: 5000,
            },
          });
        }
      }
      actions.setSubmitting(false);
    },
    [navigate, configService, alertsContext],
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
              name="username"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Username"
            />
            <ErrorMessage
              name="username"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <Field
              type="email"
              name="email"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Email"
            />
            <ErrorMessage
              name="email"
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
            <Field
              type="password"
              name="passwordConfirm"
              className="w-1/2 border-2 border-slate-700"
              placeholder="Confirm Password"
            />
            <ErrorMessage
              name="passwordConfirm"
              component="div"
              className="text-red-600"
            />
            <div className="h-2" />
            <button
              type="submit"
              className="w-1/2 rounded dark:bg-red-500 disabled:dark:bg-red-800 disabled:dark:text-gray-500"
              disabled={!(isValid && dirty) || isSubmitting}
            >
              Register
            </button>
          </Form>
        )}
      </Formik>
      <div>
        <Link to="/login" className="text-red-500">
          Login
        </Link>
      </div>
    </MainContainer>
  );
};

export default Index;
