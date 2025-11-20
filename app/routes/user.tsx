import { LoaderFunction, MetaFunction, TypedResponse } from '@remix-run/node';
import {
  ShouldRevalidateFunction,
  redirect,
  useLoaderData,
  useNavigate,
} from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import React, { useContext } from 'react';

import { getUserDetails } from '~/api/http/auth.http';
import { getSessionId } from '~/api/sessionid.lib';
import { AlertsContext } from '~/contexts/alerts';
import { IsLoggedInContext } from '~/contexts/is-logged-in';
import { useConfig } from '~/hooks/use-config';
import { handleError } from '~/libs/http-error';

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: 'Henhouse Server - Search' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

interface LoaderData {
  dehydratedState: DehydratedState;
}

export const loader: LoaderFunction = async ({
  request,
}): Promise<LoaderData | TypedResponse> => {
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
    queryKey: ['user'],
    queryFn: () => getUserDetails(process.env.API_HOST as string, sessionId),
  });

  return {
    dehydratedState: dehydrate(queryClient),
  };
};

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

const View: React.FC = () => {
  const navigate = useNavigate();

  const isLoggedInContext = useContext(IsLoggedInContext);
  const alertsContext = useContext(AlertsContext);

  const { data: configService } = useConfig();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getUserDetails(host, null).catch(reason => {
        handleError(reason, isLoggedInContext, alertsContext, navigate);
      });
    },
    enabled: configService !== undefined,
  });

  if (user !== undefined) {
    return (
      <div>
        User {user.username} ({user.email})
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
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
