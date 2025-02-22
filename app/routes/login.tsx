import { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useCallback, useMemo } from 'react';

import { MainContainer } from '~/components/main-container';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface FormValues {
  usernameEmail: string;
  password: string;
}

const Index: React.FC = () => {
  const initialValues = useMemo<FormValues>(
    () => ({ usernameEmail: '', password: '' }),
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
    (values: FormValues, actions: FormikHelpers<FormValues>) => {
      // TODO implement
      console.log(values.usernameEmail, values.password);
      actions.setSubmitting(false);
    },
    [],
  );

  return (
    <MainContainer>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid }) => (
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
            <button
              type="submit"
              className="mt-2 w-1/2 rounded dark:bg-red-500 disabled:dark:bg-red-800 disabled:dark:text-gray-500"
              disabled={isSubmitting || !isValid}
            >
              Login
            </button>
          </Form>
        )}
      </Formik>
      <div>
        <Link to="/register" className="text-red-500">
          Register
        </Link>
      </div>
    </MainContainer>
  );
};

export default Index;
