// components/posts/PostsList.tsx
import Link from 'next/link';
import type { UnifiedPost } from '@/lib/types';

type Props = {
  posts: UnifiedPost[];
};

export function PostsList({ posts }: Props) {
  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`}>
          <article className="rounded-xl border bg-[#fafcff] dark:bg-slate-800 p-4 hover:shadow-sm transition">
            <h2 className="font-semibold mb-1">{post.title}</h2>
            <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3">
              {post.body}
            </p>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-900 dark:text-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
                {post.isCustom && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400 dark:text-emerald-900">
                    NEW
                  </span>
                )}
              </div>

              {/* Read-only reaction badges – bright, but no server calls */}
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-900 dark:text-slate-200 text-xs">
                  <span className="mr-1">👍</span>
                  <span>{post.reactions.likes}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-900 dark:text-slate-200 text-xs">
                  <span className="mr-1">👎</span>
                  <span>{post.reactions.dislikes}</span>
                </span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
