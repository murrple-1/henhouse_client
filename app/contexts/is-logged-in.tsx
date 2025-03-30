import React, { PropsWithChildren, createContext, useCallback } from 'react';

import { useLocalStorage } from '~/hooks/use-local-storage';

export interface IsLoggedInContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

export const IsLoggedInContext = createContext<IsLoggedInContextType>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
});

export const IsLoggedInContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn');

  const setIsLoggedIn_ = useCallback(
    (isLoggedIn: boolean) => {
      setIsLoggedIn(isLoggedIn ? 'true' : null);
    },
    [setIsLoggedIn],
  );

  return (
    <IsLoggedInContext.Provider
      value={{
        isLoggedIn: isLoggedIn === 'true',
        setIsLoggedIn: setIsLoggedIn_,
      }}
    >
      {children}
    </IsLoggedInContext.Provider>
  );
};
