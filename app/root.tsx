import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";

export const links: LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
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
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

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
    message = "Unknown Error";
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
}

export default function App() {
  return <Outlet />;
}
