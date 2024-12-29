import { z } from "zod";

import {
  generateQueryString,
  handleError,
  handlePaginatedResponse,
  handleResponse,
  Page,
} from "~/api/utils.lib";
import { toHeaders as commonToHeaders } from "~/api/common.interface";
import {
  QueryOptions,
  toParams as queryToParams,
  toHeaders as queryToHeaders,
} from "~/api/query.interface";

const ZChapter = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  index: z.number(),
});

const ZChapterDetails = ZChapter.extend({
  createdAt: z.string().transform((value) => new Date(value)),
  publishedAt: z.string().transform((value) => new Date(value)),
  markdown: z.string(),
  story: z.string().uuid(),
});

export type Chapter = z.infer<typeof ZChapter>;
export type ChapterDetails = z.infer<typeof ZChapterDetails>;

export type SortField = keyof ChapterDetails;

export async function getChapter(
  host: string,
  chapterId: string,
  sessionId: string | null,
): Promise<ChapterDetails> {
  try {
    const response = await fetch(`${host}/api/art/chapter/${chapterId}`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: "include",
    });
    return await handleResponse(response, ZChapterDetails);
  } catch (error: unknown) {
    handleError(getChapter.name, error);
  }
}

export async function getChapters(
  host: string,
  storyId: string,
  sessionId: string | null,
  options: QueryOptions<SortField>,
): Promise<Page<Chapter>> {
  try {
    const [params, headers] = await Promise.all([
      queryToParams(options, "stories"),
      queryToHeaders(sessionId, options),
    ]);
    const response = await fetch(
      `${host}/api/art/story/${storyId}/chapter${generateQueryString(params)}`,
      {
        headers,
        credentials: "include",
      },
    );
    return await handlePaginatedResponse(response, ZChapter);
  } catch (error: unknown) {
    handleError(getChapters.name, error);
  }
}

export async function deleteChapter(
  host: string,
  id: string,
  sessionId: string | null,
): Promise<void> {
  try {
    await fetch(`${host}/api/art/chapter/${id}`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: "include",
      method: "DELETE",
    });
  } catch (error: unknown) {
    handleError(getChapters.name, error);
  }
}
