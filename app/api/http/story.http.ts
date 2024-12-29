import { z } from "zod";

import {
  handleError,
  handlePaginatedResponse,
  generateQueryString,
  Page,
  handleResponse,
} from "~/api/utils.lib";
import {
  toParams as queryToParams,
  toHeaders as queryToHeaders,
  QueryOptions,
} from "~/api/query.interface";
import { toHeaders as commonToHeaders } from "~/api/common.interface";

const ZStory = z.object({
  uuid: z.string().uuid(),
  title: z.string(),
});

const ZStoryDetails = ZStory.extend({});

export type Story = z.infer<typeof ZStory>;
export type StoryDetails = z.infer<typeof ZStoryDetails>;

export type SortField = keyof StoryDetails;

export async function getStory(
  host: string,
  id: string,
  sessionId: string | null,
): Promise<StoryDetails> {
  try {
    const response = await fetch(`${host}/api/art/story/${id}`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: "include",
    });
    return await handleResponse(response, ZStoryDetails);
  } catch (error: unknown) {
    handleError(getStory.name, error);
  }
}

export async function getStories(
  host: string,
  sessionId: string | null,
  options: QueryOptions<SortField>,
): Promise<Page<Story>> {
  try {
    const [params, headers] = await Promise.all([
      queryToParams(options, "stories"),
      queryToHeaders(sessionId, options),
    ]);

    const response = await fetch(
      `${host}/api/art/story${generateQueryString(params)}`,
      {
        headers,
        credentials: "include",
      },
    );
    return await handlePaginatedResponse(response, ZStory);
  } catch (error: unknown) {
    handleError(getStories.name, error);
  }
}
