import { parse as parseCookie } from 'cookie';

export function getCSRFToken(cookieHeader: string): string | null {
  const cookie = parseCookie(cookieHeader);
  return cookie['csrftoken'] ?? null;
}

export function setCSRFToken(csrfToken: string, headers: Headers) {
  headers.set('X-CSRFToken', csrfToken);
}
