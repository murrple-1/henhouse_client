import PropTypes from 'prop-types';
import { PropsWithChildren } from 'react';

export const MainContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <section className="container mx-auto rounded px-4 dark:bg-slate-400 dark:text-white">
      {children}
    </section>
  );
};

MainContainer.propTypes = {
  children: PropTypes.node,
};
