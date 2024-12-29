import { parse as parseCookie } from 'cookie';

export function getSessionId(request: Request): string | null {
  let sessionId: string | null = null;
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader !== null) {
    const cookie = parseCookie(cookieHeader);
    sessionId = cookie.sessionid ?? null;
  }

  return sessionId;
}
