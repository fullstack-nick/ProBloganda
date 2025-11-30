// lib/tags-service.ts
import 'server-only';
import { connectMongo } from './mongodb';
import { PostModel } from '@/models/Post';
import { fetchTags } from './dummyjson';

export type UnifiedTag = {
  slug: string;
  name: string;
};

/**
 * Combine tags from DummyJSON API + all custom posts in Mongo.
 * - API tags come from `fetchTags()`
 * - DB tags come from all PostModel documents' `tags` arrays
 * - Duplicates (by slug, case-insensitive) are removed
 */
export async function listUnifiedTags(): Promise<UnifiedTag[]> {
  await connectMongo();

  const [apiTagsRaw, dbPosts] = await Promise.all([
    fetchTags(), // [{ slug, name, url }]
    PostModel.find({}, { tags: 1, _id: 0 }).lean(),
  ]);

  const apiTags: UnifiedTag[] = (apiTagsRaw as any[]).map((t) => ({
    slug: (t.slug as string).toLowerCase(),
    name:
      (t.name as string).charAt(0).toUpperCase() +
      (t.name as string).slice(1).toLowerCase(),
  }));

  const dbTagSet = new Set<string>();
  for (const doc of dbPosts as any[]) {
    if (Array.isArray(doc.tags)) {
      for (const tag of doc.tags) {
        if (typeof tag === 'string') {
          const trimmed = tag.trim();
          if (trimmed) dbTagSet.add(trimmed);
        }
      }
    }
  }

  const dbTags: UnifiedTag[] = Array.from(dbTagSet).map((tag) => {
    const trimmed = tag.trim();
    const slug = trimmed.toLowerCase();

    const lower = trimmed.toLowerCase();
    const name =
      lower.length === 0
        ? ''
        : lower.charAt(0).toUpperCase() + lower.slice(1);

    return { slug, name };
  });

  const bySlug = new Map<string, UnifiedTag>();

  for (const t of apiTags) {
    bySlug.set(t.slug.toLowerCase(), t);
  }

  for (const t of dbTags) {
    const key = t.slug.toLowerCase();
    if (!bySlug.has(key)) {
      bySlug.set(key, t);
    }
  }

  const unified = Array.from(bySlug.values());

  return unified;
}

