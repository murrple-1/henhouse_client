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
  csrfToken: string,
  sessionId: string | null,
): Promise<TagDetails> {
  try {
    const response = await fetch(`${host}/api/art/tags/${tagName}`, {
      headers: await commonToHeaders(csrfToken, sessionId, {}),
      credentials: 'include',
    });
    return await handleResponse(response, ZTagDetails);
  } catch (error: unknown) {
    handleError(getTag.name, error);
  }
}

export async function getTags(
  host: string,
  options: QueryOptions<SortField>,
  csrfToken: string,
  sessionId: string | null,
): Promise<Page<Tag>> {
  try {
    const [headers, params] = await Promise.all([
      queryToHeaders(csrfToken, sessionId, options),
      queryToParams(options, 'tags'),
    ]);

    const response = await fetch(
      `${host}/api/art/tag${generateQueryString(params)}`,
      {
        headers,
        credentials: 'include',
      },
    );
    return await handlePaginatedResponse(response, ZTag);
  } catch (error: unknown) {
    handleError(getTags.name, error);
  }
}
