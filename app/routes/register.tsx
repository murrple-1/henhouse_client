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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUsername(e.target.value);
    },
    [setUsername],
  );

  const onEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    [setEmail],
  );

  const onPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    [setPassword],
  );

  const onPasswordConfirmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(e.target.value);
    },
    [setConfirmPassword],
  );

  return (
    <MainContainer>
      <input type="text" value={username} onChange={onUsernameChange} />
      <input type="email" value={email} onChange={onEmailChange} />
      <input type="password" value={password} onChange={onPasswordChange} />
      <input
        type="password"
        value={confirmPassword}
        onChange={onPasswordConfirmChange}
      />
      <button type="button">Search</button>
    </MainContainer>
  );
};

export default Index;
