import { Link } from '@remix-run/react';

export const Header: React.FC = () => {
  return (
    <header className="mb-4 flex min-h-8 max-w-full flex-row bg-sky-300">
      <Link to="/" className="ml-4 text-black">
        Henhouse
      </Link>
      <span className="flex-grow" />
      <Link to="/login" className="mr-4 text-black">
        Login
      </Link>
      <Link to="/register" className="mr-4 text-black">
        Register
      </Link>
    </header>
  );
};
