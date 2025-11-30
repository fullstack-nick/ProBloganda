// components/tags/TagsFisheyeCloud.tsx
'use client';

import Link from 'next/link';

type Tag = {
  slug: string;
  name: string;
};

type Props = {
  tags: Tag[];
};

export function TagsFisheyeCloud({ tags }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4 cursor-default">
      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={`/posts?tag=${encodeURIComponent(tag.slug)}`}
          className="inline-block"
        >
          <span
            className="
              inline-block
              px-3 py-1
              rounded-full
              bg-[#fafcff] dark:bg-slate-300 text-slate-900 text-sm
              transform transition-transform duration-150
              hover:scale-150 hover:bg-amber-200 hover:text-black
            "
          >
            #{tag.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
