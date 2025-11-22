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

const ZChapter = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  synopsis: z.string(),
  index: z.number(),
});

const ZChapterDetails = ZChapter.extend({
  createdAt: z
    .union([z.string().datetime({ offset: true }), z.date()])
    .transform(arg => new Date(arg)),
  publishedAt: z
    .union([z.string().datetime({ offset: true }), z.date()])
    .nullable()
    .transform(arg => (arg !== null ? new Date(arg) : null)),
  markdown: z.string(),
  story: z.string().uuid(),
});

export type Chapter = z.infer<typeof ZChapter>;
export type ChapterDetails = z.infer<typeof ZChapterDetails>;

export type SortField = keyof ChapterDetails;

export async function getStoryChapter(
  host: string,
  storyId: string,
  chapterNum: number,
  sessionId: string | null,
): Promise<ChapterDetails> {
  try {
    const response = await fetch(
      `${host}/api/art/story/${storyId}/chapter/${chapterNum.toString(10)}`,
      {
        headers: await commonToHeaders(null, sessionId, {}),
        credentials: 'include',
      },
    );
    return await handleResponse(response, ZChapterDetails);
  } catch (error: unknown) {
    handleError(getChapter.name, error);
  }
}

export async function getChapter(
  host: string,
  id: string,
  sessionId: string | null,
): Promise<ChapterDetails> {
  try {
    const response = await fetch(`${host}/api/art/chapter/${id}`, {
      headers: await commonToHeaders(null, sessionId, {}),
      credentials: 'include',
    });
    return await handleResponse(response, ZChapterDetails);
  } catch (error: unknown) {
    handleError(getChapter.name, error);
  }
}

export async function getChapters(
  host: string,
  storyId: string,
  options: QueryOptions<SortField>,
  sessionId: string | null,
): Promise<Page<Chapter>> {
  try {
    const [params, headers] = await Promise.all([
      queryToParams(options, 'stories'),
      queryToHeaders(null, sessionId, options),
    ]);
    const response = await fetch(
      `${host}/api/art/story/${storyId}/chapter${generateQueryString(params)}`,
      {
        headers,
        credentials: 'include',
      },
    );
    return await handlePaginatedResponse(response, ZChapter);
  } catch (error: unknown) {
    handleError(getChapters.name, error);
  }
}

export interface CreateChapterInput {
  name: string;
  synopsis: string;
  markdown: string;
}

export async function createChapter(
  host: string,
  storyId: string,
  body: CreateChapterInput,
  csrfToken: string,
  sessionId: string | null,
): Promise<Chapter> {
  try {
    const headers = await commonToHeaders(csrfToken, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/art/story/${storyId}/chapter`, {
      headers,
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(body),
    });
    return await handleResponse(response, ZChapter);
  } catch (error: unknown) {
    handleError(createChapter.name, error);
  }
}

export interface UpdateChapterInput {
  name?: string;
  synopsis?: string;
  markdown?: string;
}

export async function updateChapter(
  host: string,
  id: string,
  body: UpdateChapterInput,
  csrfToken: string,
  sessionId: string | null,
): Promise<Chapter> {
  try {
    const headers = await commonToHeaders(csrfToken, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/art/chapter/${id}`, {
      headers,
      credentials: 'include',
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return await handleResponse(response, ZChapter);
  } catch (error: unknown) {
    handleError(updateChapter.name, error);
  }
}

export async function deleteChapter(
  host: string,
  id: string,
  csrfToken: string,
  sessionId: string | null,
): Promise<void> {
  try {
    await fetch(`${host}/api/art/chapter/${id}`, {
      headers: await commonToHeaders(csrfToken, sessionId, {}),
      credentials: 'include',
      method: 'DELETE',
    });
  } catch (error: unknown) {
    handleError(deleteChapter.name, error);
  }
}
