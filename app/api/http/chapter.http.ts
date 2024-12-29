import { z } from "zod";

import {
  handleError,
  handlePaginatedResponse,
  handleResponse,
  Page,
} from "~/api/utils.lib";
import { toHeaders as commonToHeaders } from "~/api/common.interface";

const ZChapter = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  index: z.number(),
});

const ZChapterDetails = ZChapter.extend({});

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
): Promise<Page<Chapter>> {
  try {
    const response = await fetch(`${host}/api/art/story/${storyId}/chapter`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: "include",
    });
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
