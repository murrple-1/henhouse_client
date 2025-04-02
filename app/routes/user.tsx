import { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  dehydrate,
  useQuery,
} from '@tanstack/react-query';
import React from 'react';

import { getUserDetails } from '~/api/http/auth.http';
import { getSessionId } from '~/api/sessionid.lib';
import { useConfig } from '~/hooks/use-config';

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
}): Promise<LoaderData> => {
  const cookieHeader = request.headers.get('Cookie');
  let sessionId: string | null;
  if (cookieHeader !== null) {
    sessionId = getSessionId(cookieHeader);
  } else {
    sessionId = null;
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

const View: React.FC = () => {
  const { data: configService } = useConfig();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => {
      if (configService === undefined) {
        throw new Error('configSerive undefined');
      }
      const host = configService.get<string>('API_HOST') as string;
      return getUserDetails(host, null);
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
