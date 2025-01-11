import { setCSRFToken } from '~/api/csrftoken.lib';
import { setSessionId } from '~/api/sessionid.lib';

export interface CommonOptions {}

export async function toHeaders(
  csrfToken: string | null,
  sessionId: string | null,
  _options: CommonOptions,
) {
  const headers = new Headers();

  if (csrfToken !== null) {
    setCSRFToken(csrfToken, headers);
  }

  setSessionId(sessionId, headers);

  return headers;
}
