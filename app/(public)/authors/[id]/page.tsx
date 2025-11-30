// app/(public)/authors/[id]/page.tsx
import { notFound } from 'next/navigation';
import { fetchApiUserBasic } from '@/lib/dummyjson';
import { PostsList } from '@/components/posts/PostsList';
import { listUnifiedPostsByAuthor } from '@/lib/posts-service';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AuthorPostsPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const [author, posts] = await Promise.all([
    fetchApiUserBasic(id),
    listUnifiedPostsByAuthor(id),
  ]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">
          Posts by {author.fullName}
        </h1>
      </header>
      <PostsList
        posts={posts.map((p) => ({ ...p, isCustom: false }))}
      />
    </section>
  );
}
