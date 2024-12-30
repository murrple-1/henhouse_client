import type { LinksFunction } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { PropsWithChildren, useEffect, useState } from 'react';

import { Header } from '~/components/header';

import './tailwind.css';

export const links: LinksFunction = () => [];

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export const ErrorBoundary: React.FC = () => {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  let status: number;
  let message: string;
  if (isRouteErrorResponse(error)) {
    status = error.status;
    message = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    status = 500;
    message = error.message;
  } else {
    status = 500;
    message = 'Unknown Error';
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error ({status})</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h1>{message}</h1>
        <Scripts />
      </body>
    </html>
  );
};

const App: React.FC = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <Outlet />
    </QueryClientProvider>
  );
};

export default App;
