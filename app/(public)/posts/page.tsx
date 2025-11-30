// app/(public)/posts/page.tsx
import {
  listUnifiedPostsPage,
  searchUnifiedPosts,
  searchUnifiedPostsByTag,
} from '@/lib/posts-service';
import { PostsShell } from '@/components/posts/PostsShell';
import type { SortField, SortOrder } from '@/lib/types';

const PER_PAGE = 25;

type RawSearchParams = {
  page?: string;
  sort?: string;
  order?: string;
  q?: string;
  tag?: string;
};

type Props = {
  searchParams: Promise<RawSearchParams>;
};

export default async function PostsPage({ searchParams }: Props) {
  // ✅ unwrap the Promise first (Next 16 requirement)
  const sp = await searchParams;

  const page = Number(sp.page ?? '1') || 1;
  const sortField = (sp.sort ?? 'id') as SortField;
  const sortOrder = (sp.order ?? 'desc') as SortOrder; // default: newest
  const q = sp.q ?? '';
  const tag = (sp.tag ?? '').trim();

  // 1) Tag-only search (from /tags page clicks)
  if (tag) {
    const results = await searchUnifiedPostsByTag(
      tag,
      sortField,
      sortOrder,
    );

    return (
      <PostsShell
        mode="search"
        posts={results}
        total={results.length}
        page={1}
        perPage={results.length || 1}
        sortField={sortField}
        sortOrder={sortOrder}
        query={tag} // you could display it as "#tag" in the shell if you want
      />
    );
  }

  // If there's a search query, use unified search instead of pagination
  if (q.trim()) {
    const results = await searchUnifiedPosts(
      q.trim(),
      sortField,
      sortOrder,
    );

    return (
      <PostsShell
        mode="search"
        posts={results}
        total={results.length}
        page={1}
        perPage={results.length || 1}
        sortField={sortField}
        sortOrder={sortOrder}
        query={q}
      />
    );
  }

  const { posts, total } = await listUnifiedPostsPage({
    page,
    perPage: PER_PAGE,
    sortField,
    sortOrder,
  });

  return (
    <PostsShell
      mode="list"
      posts={posts}
      total={total}
      page={page}
      perPage={PER_PAGE}
      sortField={sortField}
      sortOrder={sortOrder}
    />
  );
}
