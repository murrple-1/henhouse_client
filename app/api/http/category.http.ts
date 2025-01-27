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

const ZCategory = z.object({
  name: z.string(),
  prettyName: z.string(),
  description: z.string(),
});

const ZCategoryDetails = ZCategory.extend({});

export type Category = z.infer<typeof ZCategory>;
export type CategoryDetails = z.infer<typeof ZCategoryDetails>;

export type SortField = keyof CategoryDetails;

export async function getCategory(
  host: string,
  tagName: string,
  sessionId: string | null,
): Promise<CategoryDetails> {
  try {
    const response = await fetch(`${host}/api/art/tags/${tagName}`, {
      headers: await commonToHeaders(null, sessionId, {}),
      credentials: 'include',
    });
    return await handleResponse(response, ZCategoryDetails);
  } catch (error: unknown) {
    handleError(getCategory.name, error);
  }
}

export async function getCategories(
  host: string,
  options: QueryOptions<SortField>,
  sessionId: string | null,
): Promise<Page<Category>> {
  try {
    const [headers, params] = await Promise.all([
      queryToHeaders(null, sessionId, options),
      queryToParams(options, 'category'),
    ]);

    const response = await fetch(
      `${host}/api/art/category${generateQueryString(params)}`,
      {
        headers,
        credentials: 'include',
      },
    );
    return await handlePaginatedResponse(response, ZCategory);
  } catch (error: unknown) {
    handleError(getCategories.name, error);
  }
}
