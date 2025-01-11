import { z } from 'zod';

import { toHeaders as commonToHeaders } from '~/api/common.interface';
import {
  MultiEntryQueryParams,
  generateMultiEntryQueryString,
  handleEmptyResponse,
  handleError,
  handleResponse,
} from '~/api/utils.lib';

const ZUser = z.object({
  uuid: z.string().uuid(),
  username: z.string(),
});

const ZUserDetails = ZUser.extend({
  email: z.string().email(),
  attributes: z.record(z.string().nullable()),
});

export type User = z.infer<typeof ZUser>;
export type UserDetails = z.infer<typeof ZUserDetails>;

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export async function register(
  host: string,
  body: RegisterInput,
  csrfToken: string,
): Promise<void> {
  try {
    const headers = await commonToHeaders(csrfToken, null, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/appadmin/register`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export interface LoginInput {
  usernameEmail: string;
  password: string;
  stayLoggedIn: boolean;
}

export async function login(
  host: string,
  body: LoginInput,
  csrfToken: string,
): Promise<void> {
  try {
    const headers = await commonToHeaders(csrfToken, null, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/appadmin/login`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(login.name, error);
  }
}

export async function logout(
  host: string,
  sessionId: string | null,
  csrfToken: string,
): Promise<void> {
  try {
    const response = await fetch(`${host}/api/appadmin/logout`, {
      headers: await commonToHeaders(csrfToken, sessionId, {}),
      method: 'POST',
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(logout.name, error);
  }
}

export interface ChangePasswordInput {
  password: string;
}

export async function changePassword(
  host: string,
  body: ChangePasswordInput,
  csrfToken: string,
  sessionId: string | null,
): Promise<void> {
  try {
    const headers = await commonToHeaders(csrfToken, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/appadmin/user/password`, {
      headers,
      method: 'PUT',
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(changePassword.name, error);
  }
}

export async function requestPasswordReset(
  host: string,
  csrfToken: string,
  sessionId: string | null,
): Promise<void> {
  try {
    // TODO not implement server-side yet
    const headers = await commonToHeaders(csrfToken, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/appadmin/user/passwordreset`, {
      headers,
      method: 'POST',
      body: JSON.stringify({}),
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(requestPasswordReset.name, error);
  }
}

export async function passwordResetConfirm(
  host: string,
  csrfToken: string,
  sessionId: string | null,
): Promise<void> {
  try {
    // TODO not implement server-side yet
    const headers = await commonToHeaders(csrfToken, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(
      `${host}/api/appadmin/user/passwordresetconfirm`,
      {
        headers,
        method: 'POST',
        body: JSON.stringify({}),
        credentials: 'include',
      },
    );
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(passwordResetConfirm.name, error);
  }
}

export async function getUserDetails(
  host: string,
  sessionId: string | null,
): Promise<UserDetails> {
  try {
    const response = await fetch(`${host}/api/appadmin/user`, {
      headers: await commonToHeaders(null, sessionId, {}),
      credentials: 'include',
    });
    return await handleResponse(response, ZUserDetails);
  } catch (error: unknown) {
    handleError(getUserDetails.name, error);
  }
}

export async function userLookup(
  host: string,
  userIds: string[],
  sessionId: string | null,
): Promise<User[]> {
  try {
    const headers = await commonToHeaders(null, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const params: MultiEntryQueryParams = {
      userIds,
    };

    const response = await fetch(
      `${host}/api/appadmin/user/lookup${generateMultiEntryQueryString(params)}`,
      {
        headers,
        credentials: 'include',
      },
    );
    return await handleResponse(response, z.array(ZUser));
  } catch (error: unknown) {
    handleError(userLookup.name, error);
  }
}

export interface UpdateUserAttributesInput {
  attributes: Record<string, string | null>;
}

export async function updateUserAttributes(
  host: string,
  body: UpdateUserAttributesInput,
  csrfToken: string,
  sessionId: string | null,
): Promise<void> {
  try {
    const headers = await commonToHeaders(csrfToken, sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/appadmin/user/attributes`, {
      headers,
      body: JSON.stringify(body),
      method: 'PUT',
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(updateUserAttributes.name, error);
  }
}

export async function deleteUser(
  host: string,
  csrfToken: string,
  sessionId: string | null,
): Promise<void> {
  try {
    const response = await fetch(`${host}/api/appadmin/user`, {
      headers: await commonToHeaders(csrfToken, sessionId, {}),
      method: 'DELETE',
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(deleteUser.name, error);
  }
}

export async function getCSRFToken(host: string): Promise<void> {
  try {
    const response = await fetch(`${host}/api/appadmin/csrf`, {
      headers: await commonToHeaders(null, null, {}),
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(getCSRFToken.name, error);
  }
}
