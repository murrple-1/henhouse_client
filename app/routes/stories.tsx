import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  dehydrate,
  DehydratedState,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React from "react";

interface LoaderData {
  dehydratedState: DehydratedState;
}

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const queryClient = new QueryClient();

  return {
    dehydratedState: dehydrate(queryClient),
  };
};

const View: React.FC = () => {
  return <div>Stories</div>;
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
