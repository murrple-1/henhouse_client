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

import { getCSRFToken } from '~/api/http/auth.http';
import { Header } from '~/components/header';
import { useConfig } from '~/hooks/use-config';

import { IsLoggedInContextProvider } from './contexts/is-logged-in';
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

const InnerApp: React.FC = () => {
  const [csrfLoaded, setCsrfLoaded] = useState(false);

  const { data: configService } = useConfig();

  useEffect(() => {
    if (configService !== undefined) {
      const host = configService.get<string>('API_HOST') as string;
      getCSRFToken(host).then(() => {
        setCsrfLoaded(true);
      });
    }
  }, [configService, setCsrfLoaded]);

  if (!csrfLoaded) {
    // TODO loading
    return null;
  } else {
    return (
      <>
        <Header />
        <Outlet />
      </>
    );
  }
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
      <IsLoggedInContextProvider>
        <InnerApp />
      </IsLoggedInContextProvider>
    </QueryClientProvider>
  );
};

export default App;
