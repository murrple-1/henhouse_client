import PropTypes from 'prop-types';
import { PropsWithChildren } from 'react';

export const MainContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <section className="container mx-auto flex flex-col items-center rounded-sm p-4 dark:bg-gray-800 dark:text-white">
      {children}
    </section>
  );
};

MainContainer.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
};
