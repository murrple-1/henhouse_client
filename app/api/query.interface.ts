import {
  CommonOptions,
  toHeaders as commonToHeaders,
} from '~/api/common.interface';
import { Sort } from '~/api/sort.interface';
import { QueryParams } from '~/api/utils.lib';

export interface QueryOptions<SortField extends string> extends CommonOptions {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: Sort<SortField> | string;
}

export async function toHeaders<SortField extends string>(
  csrfToken: string | null,
  sessionId: string | null,
  options: QueryOptions<SortField>,
) {
  const headers = await commonToHeaders(csrfToken, sessionId, options);
  return headers;
}

export async function toParams<SortField extends string>(
  options: QueryOptions<SortField>,
  descriptor?: string,
) {
  const params: QueryParams = {};

  if (descriptor !== undefined) {
    params['_'] = descriptor;
  }

  if (options.limit !== undefined) {
    params['limit'] = options.limit.toString(10);
  }

  if (options.offset !== undefined) {
    params['offset'] = options.offset.toString(10);
  }

  if (options.search !== undefined) {
    params['search'] = options.search;
  }

  if (options.sort !== undefined) {
    if (typeof options.sort === 'string') {
      params['sort'] = options.sort;
    } else {
      const sortParts: string[] = [];

      for (const [field, direction] of options.sort.entries()) {
        sortParts.push(`${field}:${direction}`);
      }

      params['sort'] = sortParts.join(',');
    }
  }

  return params;
}
