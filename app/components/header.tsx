import { Link, useNavigate } from '@remix-run/react';
import React, { useCallback, useContext, useState } from 'react';

import { getCSRFToken } from '~/api/csrftoken.lib';
import { logout } from '~/api/http/auth.http';
import { Modal } from '~/components/modal';
import { AlertsContext } from '~/contexts/alerts';
import { IsLoggedInContext } from '~/contexts/is-logged-in';
import { useConfig } from '~/hooks/use-config';
import { handleError } from '~/libs/http-error';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  const isLoggedInContext = useContext(IsLoggedInContext);
  const alertsContext = useContext(AlertsContext);

  const { data: configService } = useConfig();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const onLogoutModalRequestClose = useCallback(() => {
    setIsLogoutModalOpen(false);
  }, [setIsLogoutModalOpen]);

  const onLogoutModalYesClick = useCallback(async () => {
    setIsLogoutModalOpen(false);

    if (isLoggedInContext === null) {
      throw new Error('isLoggedInContext null');
    }

    if (configService === undefined) {
      throw new Error('configSerive undefined');
    }

    const csrfToken = getCSRFToken(document.cookie);
    if (csrfToken === null) {
      throw new Error('csrfToken null');
    }

    const host = configService.get<string>('API_HOST') as string;

    try {
      await logout(host, null, csrfToken);
    } catch (error: unknown) {
      handleError(error, isLoggedInContext, alertsContext, navigate);
    }
    isLoggedInContext.setIsLoggedIn(false);
    navigate('/');
  }, [
    isLoggedInContext,
    alertsContext,
    navigate,
    configService,
    setIsLogoutModalOpen,
  ]);

  const doLogout = useCallback(() => {
    setIsLogoutModalOpen(true);
  }, [setIsLogoutModalOpen]);

  const onLogoutClick = useCallback(async () => await doLogout(), [doLogout]);

  const onLogoutKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        doLogout();
      }
    },
    [doLogout],
  );

  const rightLinks: React.ReactNode[] = isLoggedInContext.isLoggedIn
    ? [
        <Link key="rightLinks-user" to="/user" className="mr-4 text-black">
          Account
        </Link>,
        <Link
          key="rightLinks-my-stories"
          to="/stories/my"
          className="mr-4 text-black"
        >
          My Stories
        </Link>,
        <div
          key="rightLinks-logout"
          role="button"
          className="mr-4 text-black"
          onClick={onLogoutClick}
          onKeyUp={onLogoutKeyUp}
          tabIndex={0}
        >
          Logout
        </div>,
      ]
    : [
        <Link key="rightLinks-login" to="/login" className="mr-4 text-black">
          Login
        </Link>,
        <Link
          key="rightLinks-register"
          to="/register"
          className="mr-4 text-black"
        >
          Register
        </Link>,
      ];

  return (
    <>
      <header className="mb-4 flex min-h-8 max-w-full flex-row bg-sky-300">
        <Link to="/" className="ml-4 text-black">
          Henhouse
        </Link>
        <span className="grow" />
        {rightLinks}
      </header>
      <Modal
        isOpen={isLogoutModalOpen}
        onRequestClose={onLogoutModalRequestClose}
        contentLabel="Logout Modal"
      >
        <div>Are you sure you want to logout?</div>
        <div className="mt-2 flex flex-row">
          <button
            className="w-24 rounded-sm dark:bg-red-500"
            onClick={onLogoutModalYesClick}
          >
            Yes
          </button>
          <span className="grow" />
          <button
            className="w-24 rounded-sm dark:bg-red-500"
            onClick={onLogoutModalRequestClose}
          >
            No
          </button>
        </div>
      </Modal>
    </>
  );
};
