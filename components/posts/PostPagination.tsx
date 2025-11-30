// components/posts/PostPagination.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type PostPaginationProps = {
  page: number;    // current page (1-based)
  perPage: number; // items per page
  total: number;   // total items across all pages
  onPageChange?: (nextPage: number) => void;
};

export function PostPagination({ page, perPage, total, onPageChange, }: PostPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  // No need to show pagination if only one page
  if (totalPages <= 1) return null;

  function createUrl(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      // keep URL clean: /posts instead of /posts?page=1
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function goToPage(nextPage: number) {
    if (nextPage === currentPage) return;
    if (onPageChange) {
      onPageChange(nextPage);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    const url = createUrl(nextPage);
    router.push(url);
    // nice UX: scroll top on page change
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function getPageNumbers(): (number | 'dots')[] {
    const pages: (number | 'dots')[] = [];

    const siblingCount = 1; // how many neighbors around current
    const totalNumbers = siblingCount * 2 + 5; // first, last, current, neighbors, 2x dots

    if (totalPages <= totalNumbers) {
      // show all pages
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const leftSibling = Math.max(currentPage - siblingCount, 2);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

    pages.push(1); // always show first

    if (leftSibling > 2) {
      pages.push('dots');
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    if (rightSibling < totalPages - 1) {
      pages.push('dots');
    }

    pages.push(totalPages); // always show last

    return pages;
  }

  const pageItems = getPageNumbers();
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav
      aria-label="Posts pagination"
      className="mt-6 flex items-center justify-center gap-3 text-sm"
    >
      {/* Prev */}
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={isFirst}
        className="
          px-3 py-1.5 rounded-full border bg-[#fafcff] dark:bg-slate-800
          hover:bg-slate-50 dark:hover:bg-slate-700
          select-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        Previous
      </button>

      {/* Page numbers */}
      <ul className="flex items-center gap-1">
        {pageItems.map((item, idx) =>
          item === 'dots' ? (
            <li key={`dots-${idx}`} className="px-2 text-slate-400">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => goToPage(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                className={[
                  'min-w-[2.1rem] px-2 py-1.5 rounded-full border text-center select-none cursor-pointer',
                  item === currentPage
                    ? 'bg-gray-800 text-white border-black'
                    : 'bg-[#fafcff] dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      {/* Next */}
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={isLast}
        className="
          px-3 py-1.5 rounded-full border bg-[#fafcff] dark:bg-slate-800
          hover:bg-slate-50 dark:hover:bg-slate-700
          select-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        Next
      </button>
    </nav>
  );
}
