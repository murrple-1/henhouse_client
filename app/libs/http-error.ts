import { NavigateFunction } from '@remix-run/react';

import { ResponseError } from '~/api/utils.lib';
import { AlertsContextType } from '~/contexts/alerts';
import { IsLoggedInContextType } from '~/contexts/is-logged-in';

export function handleError(
  error: unknown,
  isLoggedInContext: IsLoggedInContextType,
  alertsContext: AlertsContextType,
  navigate: NavigateFunction,
) {
  let errorHandled = false;

  if (error instanceof ResponseError) {
    switch (error.status) {
      case 401: {
        isLoggedInContext.setIsLoggedIn(false);
        navigate('/login');
        errorHandled = true;
        break;
      }
    }
  }

  if (!errorHandled) {
    console.error(error);
    alertsContext.addAlert({
      type: 'error',
      message: 'An unknown error has occurred. Please try again',
      removalInfo: {
        id: 'unknown-http-error',
        timeout: 5000,
      },
    });
  }
}
