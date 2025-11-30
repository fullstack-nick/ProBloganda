// components/posts/PostsShell.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import type { UnifiedPost, SortField, SortOrder } from '@/lib/types';
import { PostsList } from './PostsList';
import { PostPagination } from './PostPagination';

type Mode = 'list' | 'search';

type Props = {
  mode: Mode;
  posts: UnifiedPost[];
  total: number;
  page: number;
  perPage: number;
  sortField: SortField;
  sortOrder: SortOrder;
  query?: string;
};

export function PostsShell({
  mode,
  posts,
  total,
  page,
  perPage,
  sortField,
  sortOrder,
  query = '',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // local query state (what's actually in the input)
  const [localQuery, setLocalQuery] = useState(query);

  const [isTinyScreen, setIsTinyScreen] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function update() {
      setIsTinyScreen(window.innerWidth <= 360);
    }

    update(); // set initial
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 🔁 Keep the input in sync with the URL
  // - prefer ?q=
  // - fall back to ?tag=
  // - otherwise empty string
  useEffect(() => {
    const qParam = searchParams.get('q');
    const tagParam = searchParams.get('tag');

    if (qParam !== null) {
      setLocalQuery(qParam);
    } else if (tagParam !== null) {
      setLocalQuery(tagParam);
    } else {
      setLocalQuery('');
    }
  }, [searchParams]);

  // animate wrapper when isPending
  const wrapperClass = isPending
    ? 'transition filter blur-[1px] animate-pulse'
    : 'transition';

  function updateParam(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `/posts?${qs}` : '/posts');
    });
  }

  function onSortChange(field: SortField) {
    const nextSort = field;
    const isRecency = nextSort === 'id';
    const defaultOrder: SortOrder = isRecency ? 'desc' : 'asc';
    updateParam({ sort: nextSort, order: defaultOrder, page: '1' });
  }

  function onOrderChange(order: SortOrder) {
    updateParam({ order, page: '1' });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = localQuery.trim();

    // When searching via text, clear any tag filter
    updateParam({
      q: trimmed || undefined,
      tag: undefined,
      page: '1',
    });
  }

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Sort dropdown */}
        <SortControl
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          onOrderChange={onOrderChange}
        />

        {/* Search + shortcuts */}
        <form
          onSubmit={onSearchSubmit}
          className="flex items-center gap-2 flex-1 justify-end"
        >
          <div className="relative w-full max-w-xs">
            <button
              type="submit"
              className="
                absolute left-3 top-1/2 -translate-y-1/2
                text-slate-400 hover:text-slate-600
                dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer
              "
              aria-label="Search posts"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="16"
                  y1="16"
                  x2="20"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder={isTinyScreen ? 'Search...' : 'Search posts...'}
              className="
                bg-[#fafcff] dark:bg-slate-800
                border rounded-full
                pl-9 pr-3 py-1.5
                text-sm w-full
              "
            />
          </div>
        </form>

        {/* Authors / Tags buttons */}
        <div className="flex gap-2">
          <a
            href="/authors"
            className="bg-[#fafcff] dark:bg-slate-800 px-3 py-1.5 rounded-full border text-sm"
          >
            Authors
          </a>
          <a
            href="/tags"
            className="bg-[#fafcff] dark:bg-slate-800 px-3 py-1.5 rounded-full border text-sm"
          >
            Tags
          </a>
        </div>
      </div>

      {/* Posts */}
      <div className={wrapperClass}>
        <PostsList posts={posts} />
      </div>

      {/* Pagination only for list mode */}
      {mode === 'list' && (
        <PostPagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={(nextPage: number) =>
            updateParam({ page: String(nextPage) })
          }
        />
      )}
    </section>
  );
}

type SortControlProps = {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange(field: SortField): void;
  onOrderChange(order: SortOrder): void;
};

function SortControl({
  sortField,
  sortOrder,
  onSortChange,
  onOrderChange,
}: SortControlProps) {
  const [open, setOpen] = useState(false);

  const isRecency = sortField === 'id';
  const orderLabel =
    isRecency && sortOrder === 'desc'
      ? 'Newest'
      : isRecency && sortOrder === 'asc'
      ? 'Oldest'
      : sortOrder === 'asc'
      ? 'Ascending'
      : 'Descending';

  const fieldButtonClass = (field: SortField) =>
    [
      'block w-full text-left px-3 py-1.5 text-sm',
      'hover:bg-slate-100 dark:hover:bg-slate-700',
      'cursor-pointer select-none',
      field === sortField
        ? 'font-semibold text-slate-900 dark:text-slate-50'
        : 'text-slate-700 dark:text-slate-200',
    ].join(' ');

  const orderButtonClass = (order: SortOrder) =>
    [
      'block w-full text-left px-3 py-1.5 text-sm',
      'hover:bg-slate-100 dark:hover:bg-slate-700',
      'cursor-pointer select-none',
      order === sortOrder
        ? 'font-semibold text-slate-900 dark:text-slate-50'
        : 'text-slate-700 dark:text-slate-200',
    ].join(' ');

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)} // tap to open on mobile
        className="
          bg-[#fafcff]
          dark:bg-slate-800
          flex items-center justify-center
          rounded-full border select-none cursor-pointer
          h-9 w-9 text-[14px]              /* mobile: small circle */
          sm:h-auto sm:w-auto             /* desktop: auto height/width */
          sm:px-3 sm:py-1.5               /* desktop padding (original) */
          sm:text-sm sm:gap-2
        "
      >
        {/* mobile: just 'Sort' */}
        <span className="sm:hidden">Sort</span>

        {/* desktop+: original look 'Sort: Recency · Newest' */}
        <span className="hidden sm:inline">Sort:</span>
        <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
          {isRecency
            ? `Recency · ${orderLabel}`
            : sortField === 'title'
            ? `Title · ${orderLabel}`
            : `Content · ${orderLabel}`}
        </span>
      </button>

      <div
        className={[
          'absolute left-0 mt-1 w-52',
          'overflow-hidden',
          'bg-[#fafcff] text-slate-900 border border-slate-200',
          'dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700',
          'shadow-lg rounded-xl transition',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <div className="p-2 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 select-none">
          Field
        </div>
        <button
          type="button"
          className={fieldButtonClass('id')}
          onClick={() => {
            onSortChange('id');
            setOpen(false);
          }}
        >
          Recency
        </button>
        <button
          type="button"
          className={fieldButtonClass('title')}
          onClick={() => {
            onSortChange('title');
            setOpen(false);
          }}
        >
          Title (A–Z)
        </button>
        <button
          type="button"
          className={fieldButtonClass('body')}
          onClick={() => {
            onSortChange('body');
            setOpen(false);
          }}
        >
          Content (A–Z)
        </button>

        <div className="border-t border-slate-200 dark:border-slate-700 mt-1 p-2 text-xs text-slate-500 dark:text-slate-400 select-none">
          Order
        </div>
        <button
          type="button"
          className={orderButtonClass(isRecency ? 'desc' : 'asc')}
          onClick={() => {
            onOrderChange(isRecency ? 'desc' : 'asc');
            setOpen(false);
          }}
        >
          {isRecency ? 'Newest' : 'Ascending'}
        </button>
        <button
          type="button"
          className={orderButtonClass(isRecency ? 'asc' : 'desc')}
          onClick={() => {
            onOrderChange(isRecency ? 'asc' : 'desc');
            setOpen(false);
          }}
        >
          {isRecency ? 'Oldest' : 'Descending'}
        </button>
      </div>
    </div>
  );
}

