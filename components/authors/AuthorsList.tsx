// components/authors/AuthorsList.tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Author = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
};

type Props = {
  authors: Author[];
};

export function AuthorsList({ authors }: Props) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return authors;
    return authors.filter((a) => {
      const first = a.firstName.toLowerCase();
      const last = a.lastName.toLowerCase();
      const full = a.fullName.toLowerCase();
      return (
        first.includes(text) ||
        last.includes(text) ||
        full.includes(text)
      );
    });
  }, [authors, q]);

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search authors..."
        className="bg-[#fafcff] dark:bg-slate-800 border rounded-full px-3 py-1.5 text-sm w-full max-w-xs"
      />
      <div className="grid gap-2">
        {filtered.map((a) => (
          <Link key={a.id} href={`/authors/${a.id}`}>
            <div className="border rounded-full px-4 py-2 bg-[#fafcff] dark:bg-slate-800 flex justify-between items-center hover:bg-[#e9eef4] dark:hover:bg-slate-900 transition">
              <span>{a.fullName}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
