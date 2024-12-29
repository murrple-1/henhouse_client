import { useQuery } from '@tanstack/react-query';

import { Config } from '~/libs/config';

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () =>
      fetch('/assets/config.json')
        .then(res => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error('Failed to fetch config.json');
          }
        })
        .then(json => new Config(json)),
  });
}
