import { z } from 'zod';

import { toHeaders as commonToHeaders } from '~/api/common.interface';
import {
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
): Promise<void> {
  try {
    const headers = await commonToHeaders(null, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/app_admin/register`, {
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

export async function login(host: string, body: LoginInput): Promise<void> {
  try {
    const headers = await commonToHeaders(null, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/app_admin/login`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export async function logout(
  host: string,
  sessionId: string | null,
): Promise<void> {
  try {
    const response = await fetch(`${host}/api/app_admin/logout`, {
      headers: await commonToHeaders(sessionId, {}),
      method: 'POST',
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export interface ChangePasswordInput {
  password: string;
}

export async function changePassword(
  host: string,
  body: ChangePasswordInput,
  sessionId: string | null,
): Promise<void> {
  try {
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/app_admin/user/password`, {
      headers,
      method: 'PUT',
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export async function requestPasswordReset(
  host: string,
  sessionId: string | null,
): Promise<void> {
  try {
    // TODO not implement server-side yet
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/app_admin/user/passwordreset`, {
      headers,
      method: 'POST',
      body: JSON.stringify({}),
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export async function passwordResetConfirm(
  host: string,
  sessionId: string | null,
): Promise<void> {
  try {
    // TODO not implement server-side yet
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(
      `${host}/api/app_admin/user/passwordresetconfirm`,
      {
        headers,
        method: 'POST',
        body: JSON.stringify({}),
        credentials: 'include',
      },
    );
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export async function getUserDetails(
  host: string,
  sessionId: string | null,
): Promise<UserDetails> {
  try {
    const response = await fetch(`${host}/api/app_admin/user`, {
      headers: await commonToHeaders(sessionId, {}),
      credentials: 'include',
    });
    return await handleResponse(response, ZUserDetails);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export async function userLookup(
  host: string,
  userIds: string[],
  sessionId: string | null,
): Promise<User[]> {
  try {
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/app_admin/user/lookup`, {
      headers,
      body: JSON.stringify(userIds),
      method: 'POST',
      credentials: 'include',
    });
    return await handleResponse(response, z.array(ZUser));
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export interface UpdateUserAttributesInput {
  attributes: Record<string, string | null>;
}

export async function updateUserAttributes(
  host: string,
  body: UpdateUserAttributesInput,
  sessionId: string | null,
): Promise<void> {
  try {
    const headers = await commonToHeaders(sessionId, {});
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${host}/api/app_admin/user/attributes`, {
      headers,
      body: JSON.stringify(body),
      method: 'PUT',
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}

export async function deleteUser(
  host: string,
  sessionId: string | null,
): Promise<void> {
  try {
    const response = await fetch(`${host}/api/app_admin/user`, {
      headers: await commonToHeaders(sessionId, {}),
      method: 'DELETE',
      credentials: 'include',
    });
    return await handleEmptyResponse(response);
  } catch (error: unknown) {
    handleError(register.name, error);
  }
}
