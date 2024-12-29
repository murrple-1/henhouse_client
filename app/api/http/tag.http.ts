import { z } from 'zod';

import { toHeaders as commonToHeaders } from '~/api/common.interface';
import {
  Page,
  handleError,
  handlePaginatedResponse,
  handleResponse,
} from '~/api/utils.lib';

const ZTag = z.object({
  name: z.string(),
});

const ZTagDetails = ZTag.extend({
  description: z.string(),
});

export type Tag = z.infer<typeof ZTag>;
export type TagDetails = z.infer<typeof ZTagDetails>;

export type SortField = keyof TagDetails;

export async function getTag(
  host: string,
  tagName: string,
  sessionId: string | null,
): Promise<TagDetails> {
  try {
    const response = await fetch(`${host}/api/art/tags/${tagName}`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: 'include',
    });
    return await handleResponse(response, ZTagDetails);
  } catch (error: unknown) {
    handleError(getTag.name, error);
  }
}

export async function getTags(
  host: string,
  sessionId: string | null,
): Promise<Page<Tag>> {
  try {
    const response = await fetch(`${host}/api/art/tag`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: 'include',
    });
    return await handlePaginatedResponse(response, ZTag);
  } catch (error: unknown) {
    handleError(getTags.name, error);
  }
}
