// app/(public)/tags/page.tsx
import { listUnifiedTags } from '@/lib/tags-service';
import { TagsFisheyeCloud } from '@/components/tags/TagsFisheyeCloud';

export default async function TagsPage() {
  const tags = await listUnifiedTags(); // [{ slug, name, url }]

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">All tags</h1>
      <p className="text-sm text-slate-600">
        Hover your cursor over tags to magnify them. Click a tag to see posts.
      </p>
      <TagsFisheyeCloud tags={tags} />
    </section>
  );
}
