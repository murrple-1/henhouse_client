import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { serverOnly$ } from 'vite-env-only/macros';

const getSessionId__server = serverOnly$((cookieHeader: string) => {
  const cookie = parseCookie(cookieHeader);
  return cookie['sessionid'] ?? null;
});

const getSessionId__client = () => {
  return null;
};

export const getSessionId = getSessionId__server ?? getSessionId__client;

const setSessionId__server = serverOnly$(
  (sessionId: string | null, headers: Headers) => {
    if (sessionId !== null) {
      headers.set('Cookie', serializeCookie('sessionid', sessionId));
    }
  },
);

const setSessionId__client = () => {};

export const setSessionId = setSessionId__server ?? setSessionId__client;
