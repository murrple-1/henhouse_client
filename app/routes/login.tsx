import { MetaFunction } from '@remix-run/node';
import React, { useCallback, useState } from 'react';

import { MainContainer } from '~/components/main-container';

export const meta: MetaFunction = () => {
  return [
    { title: 'Henhouse Server' },
    { name: 'description', content: 'Welcome to Henhouse!' },
  ];
};

const Index: React.FC = () => {
  const [usernameEmail, setUsernameEmail] = useState('');
  const [password, setPassword] = useState('');

  const onUsernameEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUsernameEmail(e.target.value);
    },
    [setUsernameEmail],
  );

  const onPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    [setPassword],
  );

  const onLoginClick = useCallback(() => {
    // TODO implement
    console.log(usernameEmail, password);
  }, [usernameEmail, password]);

  return (
    <MainContainer>
      <input
        type="text"
        value={usernameEmail}
        onChange={onUsernameEmailChange}
      />
      <input type="password" value={password} onChange={onPasswordChange} />
      <button type="button" onClick={onLoginClick}>
        Login
      </button>
    </MainContainer>
  );
};

export default Index;
