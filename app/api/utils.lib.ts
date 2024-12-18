import { z } from "zod";

export class FetchError implements Error {
  constructor(
    public status: number,
    public text: string,
  ) {}

  get name() {
    return "FetchError";
  }

  get message() {
    return this.text;
  }
}

export class ResponseError implements Error {
  constructor(
    public text: string,
    public status: number,
    public originalResponse: Response,
    public stack?: string,
  ) {}

  get name() {
    return "ResponseError";
  }

  get message() {
    return this.text;
  }
}

export interface Page<T> {
  count: number;
  items: T[];
}

export async function handlePaginatedResponse<
  Output,
  Def extends z.ZodTypeDef,
  Input,
>(
  response: Response,
  zSchema: z.ZodType<Output, Def, Input>,
): Promise<Page<Output>> {
  return await handleResponse(
    response,
    z.object({
      count: z.number().int(),
      items: z.array(zSchema),
    }),
  );
}

export async function handleResponse<Output, Def extends z.ZodTypeDef, Input>(
  response: Response,
  zSchema: z.ZodType<Output, Def, Input>,
) {
  if (response.ok) {
    const json = await response.json();
    try {
      return zSchema.parse(json) as Output;
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        console.error("failed to parse:", json);
      }
      throw error;
    }
  } else {
    const text = await response.text();
    throw new ResponseError(text, response.status, response);
  }
}

export async function handleTextResponse<T>(
  response: Response,
  toTFn: (text: string) => T,
) {
  if (response.ok) {
    return toTFn(await response.text());
  } else {
    const text = await response.text();
    throw new ResponseError(text, response.status, response);
  }
}

export async function handleEmptyResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    throw new ResponseError(text, response.status, response);
  }
}

// In a real app, would likely call an error logging service.
export function handleError(context: string, error: unknown): never {
  console.error("API call failed:", context);

  if (error instanceof ResponseError) {
    throw error;
  }

  const error_ = error as {
    status: number;
    text: string;
  };
  if (typeof error_.status === "number" && typeof error_.text === "string") {
    throw new FetchError(error_.status, error_.text);
  } else {
    throw error;
  }
}

export type QueryParams = Record<string, string>;

export function generateQueryString(params: QueryParams) {
  const keys = Object.keys(params);

  if (keys.length > 0) {
    return `?${keys
      .map(
        (k) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(params[k] as string)}`,
      )
      .join("&")}`;
  } else {
    return "";
  }
}