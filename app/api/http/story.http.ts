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
  synopsis: z.string(),
  creator: z.string().uuid(),
});

const ZStoryDetails = ZStory.extend({
  createdAt: z
    .union([z.string().datetime({ offset: true }), z.date()])
    .transform(arg => new Date(arg)),
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
  options: QueryOptions<SortField>,
  sessionId: string | null,
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

export interface CreateStoryInput {
  title: string;
  tags: string[];
}

export async function createStory(
  host: string,
  body: CreateStoryInput,
  sessionId: string | null,
): Promise<Story> {
  try {
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/art/story`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return await handleResponse(response, ZStory);
  } catch (error: unknown) {
    handleError(createStory.name, error);
  }
}

export interface UpdateStoryInput {
  title?: string;
  tags?: string[];
}

export async function updateStory(
  host: string,
  id: string,
  body: UpdateStoryInput,
  sessionId: string | null,
): Promise<Story> {
  try {
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/art/story/${id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return await handleResponse(response, ZStory);
  } catch (error: unknown) {
    handleError(updateStory.name, error);
  }
}

export async function deleteStory(
  host: string,
  id: string,
  sessionId: string | null,
): Promise<void> {
  try {
    await fetch(`${host}/api/art/story/${id}`, {
      method: 'DELETE',
      headers: await commonToHeaders(sessionId, {}),
      credentials: 'include',
    });
  } catch (error: unknown) {
    handleError(deleteStory.name, error);
  }
}
