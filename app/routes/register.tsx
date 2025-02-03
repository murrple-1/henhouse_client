import { MetaFunction } from '@remix-run/node';
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
    // TODO implement
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
          <Form>
            <label htmlFor="username">Username</label>
            <Field type="text" name="username" />
            <ErrorMessage name="username" component="div" />
            <label htmlFor="email">Email</label>
            <Field type="email" name="email" />
            <ErrorMessage name="email" component="div" />
            <label htmlFor="password">Password</label>
            <Field type="password" name="password" />
            <ErrorMessage name="password" component="div" />
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <Field type="password" name="passwordConfirm" />
            <ErrorMessage name="passwordConfirm" component="div" />
            <button type="submit" disabled={isSubmitting || !isValid}>
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </MainContainer>
  );
};

export default Index;
