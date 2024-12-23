import { useCallback, useState } from "react";

export default function Index() {
  const [usernameEmail, setUsernameEmail] = useState("");
  const [password, setPassword] = useState("");

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
  }, [usernameEmail, password]);

  return (
    <div>
      <input
        type="text"
        value={usernameEmail}
        onChange={onUsernameEmailChange}
      />
      <input type="password" value={password} onChange={onPasswordChange} />
      <button type="button" onClick={onLoginClick}>
        Login
      </button>
    </div>
  );
}
