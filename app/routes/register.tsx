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
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Index: React.FC = () => {
  const initialValues = useMemo<FormValues>(
    () => ({ username: '', email: '', password: '', confirmPassword: '' }),
    [],
  );

  const validate = useCallback((values: FormValues) => {
    const errors: Record<string, string> = {};

    if (values.username.trim() === '') {
      errors.username = 'Required';
    }

    if (values.email.trim() === '') {
      errors.email = 'Required';
    }

    // TODO not quite right
    if (values.password === '') {
      errors.password = 'Required';
    }

    if (values.confirmPassword === '') {
      errors.confirmPassword = 'Required';
    }

    return errors;
  }, []);

  const onSubmit = useCallback(
    (values: FormValues, actions: FormikHelpers<FormValues>) => {
      // TODO implement
      console.log(
        values.username,
        values.email,
        values.password,
        values.confirmPassword,
      );
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
            <button type="submit" disabled={isSubmitting || !isValid}>
              Submit
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
