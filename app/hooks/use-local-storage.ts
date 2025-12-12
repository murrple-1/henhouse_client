import { useEffect, useState } from 'react';

export function useLocalStorage(
  key: string,
): [string | null, (nextState: string | null) => void] {
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(localStorage.getItem(key));
  }, [key, setState]);

  const setWithLocalStorage = (nextState: string | null) => {
    if (nextState === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, nextState);
    }
    setState(nextState);
  };

  return [state, setWithLocalStorage];
}
