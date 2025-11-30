// app/(public)/authors/page.tsx
import { fetchAllAuthors } from '@/lib/dummyjson';
import { AuthorsList } from '@/components/authors/AuthorsList';

export default async function AuthorsPage() {
  const authors = await fetchAllAuthors();

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Authors</h1>
      <p className="text-sm text-slate-600">
        Search by first or last name; click an author to see their posts.
      </p>
      <AuthorsList authors={authors} />
    </section>
  );
}
