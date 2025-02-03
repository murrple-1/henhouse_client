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
    // TODO implement
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
          <Form>
            <label htmlFor="usernameEmail">Username/Email</label>
            <Field type="text" name="usernameEmail" />
            <ErrorMessage name="usernameEmail" component="div" />
            <label htmlFor="password">Password</label>
            <Field type="password" name="password" />
            <ErrorMessage name="password" component="div" />
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
