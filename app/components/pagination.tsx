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
        <Link key={page} to={toHrefFn((page - 1) * limit, limit)}>
          {page}
        </Link>
      ),
      [toHrefFn, limit],
    );

    const pageLinks: React.ReactElement[] = [];

    if (currentPage > 3) {
      pageLinks.push(createPageLink(1));
      if (currentPage > 4) {
        pageLinks.push(<span key="start-ellipsis">…</span>);
      }
    }

    for (
      let i = Math.max(1, currentPage - 2);
      i <= Math.min(totalPages, currentPage + 2);
      i++
    ) {
      if (i === currentPage) {
        pageLinks.push(<span key={i}>{i}</span>);
      } else {
        pageLinks.push(createPageLink(i));
      }
    }

    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pageLinks.push(<span key="end-ellipsis">…</span>);
      }
      pageLinks.push(createPageLink(totalPages));
    }

    return <div>{pageLinks}</div>;
  },
);

Pagination.propTypes = {
  currentOffset: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  toHrefFn: PropTypes.func.isRequired,
  totalEntries: PropTypes.number.isRequired,
};
Pagination.displayName = 'Pagination';
