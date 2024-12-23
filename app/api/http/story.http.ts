import { z } from "zod";

import {
  handleError,
  handlePaginatedResponse,
  generateQueryString,
  Page,
} from "~/api/utils.lib";
import {
  toParams as queryToParams,
  toHeaders as queryToHeaders,
  QueryOptions,
} from "~/api/query.interface";

const ZStory = z.object({
  uuid: z.string().uuid(),
  title: z.string(),
});

export type Story = z.infer<typeof ZStory>;

export type SortField = keyof Story;

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
