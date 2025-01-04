import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@remix-run/react';
import PropTypes from 'prop-types';
import { memo, useCallback, useMemo } from 'react';

interface Props {
  totalEntries: number;
  currentOffset: number;
  limit: number;
  toHrefFn: (offset: number, limit: number) => string;
}

export const Pagination: React.FC<Props> = memo(
  ({ totalEntries, currentOffset, limit, toHrefFn }) => {
    const totalPages = useMemo(
      () => Math.ceil(totalEntries / limit),
      [totalEntries, limit],
    );
    const currentPage = useMemo(
      () => Math.floor(currentOffset / limit) + 1,
      [currentOffset, limit],
    );

    const createPageLink = useCallback(
      (page: number) => (
        <Link
          key={`pageLinks-${page}`}
          to={toHrefFn((page - 1) * limit, limit)}
          className="px-2 text-blue-500 hover:text-blue-700"
        >
          {page}
        </Link>
      ),
      [toHrefFn, limit],
    );

    const pageLinks: React.ReactElement[] = [];

    if (currentPage > 3) {
      pageLinks.push(createPageLink(1));
      if (currentPage > 4) {
        pageLinks.push(
          <span key="start-ellipsis" className="px-2">
            …
          </span>,
        );
      }
    }

    for (
      let i = Math.max(1, currentPage - 2);
      i <= Math.min(totalPages, currentPage + 2);
      i++
    ) {
      if (i === currentPage) {
        pageLinks.push(
          <span key={`pageLinks-${i}`} className="px-2">
            {i}
          </span>,
        );
      } else {
        pageLinks.push(createPageLink(i));
      }
    }

    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pageLinks.push(
          <span key="end-ellipsis" className="px-2">
            …
          </span>,
        );
      }
      pageLinks.push(createPageLink(totalPages));
    }

    const previousElement =
      currentPage === 1 ? (
        <span className="pr-2">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1" height="1em" />
          Previous
        </span>
      ) : (
        <Link
          to={toHrefFn((currentPage - 2) * limit, limit)}
          className="pr-2 text-blue-500 hover:text-blue-700"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1" height="1em" />
          Previous
        </Link>
      );

    const nextElement =
      currentPage === totalPages ? (
        <span className="pl-2">
          Next
          <FontAwesomeIcon icon={faArrowRight} className="ml-1" height="1em" />
        </span>
      ) : (
        <Link
          to={toHrefFn(currentPage * limit, limit)}
          className="pl-2 text-blue-500 hover:text-blue-700"
        >
          Next
          <FontAwesomeIcon icon={faArrowRight} className="ml-1" height="1em" />
        </Link>
      );

    return (
      <div className="flex items-center justify-center pt-4">
        <div className="flex w-full items-center justify-between border-t border-gray-200">
          <div className="flex items-center">{previousElement}</div>
          <div className="flex items-center">{pageLinks}</div>
          <div className="flex items-center">{nextElement}</div>
        </div>
      </div>
    );
  },
);

Pagination.propTypes = {
  currentOffset: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  toHrefFn: PropTypes.func.isRequired,
  totalEntries: PropTypes.number.isRequired,
};
Pagination.displayName = 'Pagination';
