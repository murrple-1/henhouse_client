import { z } from 'zod';

import { toHeaders as commonToHeaders } from '~/api/common.interface';
import {
  QueryOptions,
  toHeaders as queryToHeaders,
  toParams as queryToParams,
} from '~/api/query.interface';
import {
  Page,
  generateQueryString,
  handleError,
  handlePaginatedResponse,
  handleResponse,
} from '~/api/utils.lib';

const ZStory = z.object({
  uuid: z.string().uuid(),
  title: z.string(),
});

const ZStoryDetails = ZStory.extend({
  createdAt: z
    .union([z.string().datetime({ offset: true }), z.date()])
    .transform(arg => new Date(arg)),
  creator: z.string().uuid(),
  tags: z.array(z.string()),
});

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
      credentials: 'include',
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
      queryToParams(options, 'stories'),
      queryToHeaders(sessionId, options),
    ]);

    const response = await fetch(
      `${host}/api/art/story${generateQueryString(params)}`,
      {
        headers,
        credentials: 'include',
      },
    );
    return await handlePaginatedResponse(response, ZStory);
  } catch (error: unknown) {
    handleError(getStories.name, error);
  }
}
