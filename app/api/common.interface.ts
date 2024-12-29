import { setSessionId } from '~/api/sessionid.lib';

export interface CommonOptions {}

export async function toHeaders(
  sessionId: string | null,
  _options: CommonOptions,
) {
  const headers = new Headers();

  setSessionId(sessionId, headers);

  return headers;
}
