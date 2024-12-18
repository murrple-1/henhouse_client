import { serialize as serializeCookie } from "cookie";

export function setSessionId(sessionId: string | null, headers: Headers) {
  if (sessionId !== null) {
    headers.set("Cookie", serializeCookie("sessionid", sessionId));
  }
}
