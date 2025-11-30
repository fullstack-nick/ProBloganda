// lib/posts-service.ts
import 'server-only';
import { connectMongo } from './mongodb';
import { PostModel } from '@/models/Post';
import {
  fetchApiPost,
  searchApiPosts,
  sortApiPosts,
  fetchAuthorPosts,
  fetchPostsByTag,
} from './dummyjson';
import type {
  UnifiedPost,
  CustomPost,
  SortField,
  SortOrder,
} from './types';
import type { SortOrder as MongooseSortOrder } from 'mongoose';

const API_POST_COUNT = 251; // known from DummyJSON (1..251)

function toUnifiedFromDb(doc: any): CustomPost {
  const r = doc.reactions ?? {};

  return {
    id: doc.id,
    title: doc.title,
    body: doc.body,
    tags: doc.tags,
    reactions: {
      likes: typeof r.likes === 'number' ? r.likes : 0,
      dislikes: typeof r.dislikes === 'number' ? r.dislikes : 0,
    },
    userId: doc.userId,
    isCustom: true,
  };
}

export async function getUnifiedPostById(
  id: number,
): Promise<UnifiedPost | null> {
  await connectMongo();

  // Check DB first
  const dbPost = await PostModel.findOne({ id }).lean();
  if (dbPost) return toUnifiedFromDb(dbPost);

  // Else API
  if (id <= API_POST_COUNT) {
    const apiPost = await fetchApiPost(id);
    return { ...apiPost, isCustom: false };
  }

  return null;
}

export async function listUnifiedPostsByAuthor(
  userId: number,
): Promise<UnifiedPost[]> {
  await connectMongo();

  const [apiPosts, dbPostsDocs] = await Promise.all([
    fetchAuthorPosts(userId),            // API posts by author
    PostModel.find({ userId }).lean(),   // custom posts by same author
  ]);

  const apiUnified: UnifiedPost[] = apiPosts.map((p) => ({
    ...p,
    isCustom: false,
  }));

  const dbUnified: UnifiedPost[] = dbPostsDocs.map(toUnifiedFromDb);

  // API first, then custom
  return [...apiUnified, ...dbUnified];
}

export async function getNextCustomPostId(): Promise<number> {
  await connectMongo();
  const last = await PostModel.findOne().sort({ id: -1 }).lean<{ id?: number }>();
  const maxDbId = last?.id ?? API_POST_COUNT;
  return maxDbId + 1;
}

export async function listUnifiedPostsPage(options: {
  page: number;
  perPage: number;
  sortField: SortField;
  sortOrder: SortOrder;
}) {
  const { page, perPage, sortField, sortOrder } = options;

  await connectMongo();

  // 1) Get sorted API posts
  const apiPosts = await sortApiPosts(sortField, sortOrder);
  const apiUnified: UnifiedPost[] = apiPosts.map((p) => ({
    ...p,
    isCustom: false,
  }));

  // 2) Get all custom posts sorted server-side
  const dbField = sortField === 'id' ? 'id' : sortField;

  const sortObject: Record<string, MongooseSortOrder> = {
    [dbField]: sortOrder, // sortOrder is 'asc' | 'desc'
  };

  const dbPostsDocs = await PostModel.find({})
    .sort(sortObject)
    .lean();

  const dbPosts: UnifiedPost[] = dbPostsDocs.map(toUnifiedFromDb);

  // 3) Merge lists and re-sort by same criteria
  const unified = [...apiUnified, ...dbPosts];

  unified.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'id') cmp = a.id - b.id;
    else cmp = a[sortField].localeCompare(b[sortField]);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // 4) Pagination
  const total = unified.length;
  const start = (page - 1) * perPage;
  const slice = unified.slice(start, start + perPage);

  return { posts: slice, total };
}

// lib/posts-service.ts

function sortPostsInMemory(
  posts: UnifiedPost[],
  sortField: SortField,
  sortOrder: SortOrder,
): UnifiedPost[] {
  const sorted = [...posts];

  sorted.sort((a, b) => {
    let cmp = 0;

    if (sortField === 'id') {
      cmp = a.id - b.id;
    } else {
      const aVal = (a[sortField] ?? '').toString().toLowerCase();
      const bVal = (b[sortField] ?? '').toString().toLowerCase();
      cmp = aVal.localeCompare(bVal);
    }

    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return sorted;
}


export async function searchUnifiedPosts(
  q: string,
  sortField: SortField = 'id',
  sortOrder: SortOrder = 'desc',
): Promise<UnifiedPost[]> {
  await connectMongo();
  const [apiResults, dbResultsDocs] = await Promise.all([
    searchApiPosts(q),
    PostModel.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { body: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: `^${q}$`, $options: 'i' } } },
      ],
    }).lean(),
  ]);

  const unifiedApi: UnifiedPost[] = apiResults.map((p) => ({
    ...p,
    isCustom: false,
  }));

  const unifiedDb: UnifiedPost[] = dbResultsDocs.map(toUnifiedFromDb);

  // dedupe by id in final
  const map = new Map<number, UnifiedPost>();
  for (const p of [...unifiedApi, ...unifiedDb]) {
    if (!map.has(p.id)) map.set(p.id, p);
  }

  const results = [...map.values()];

  // 🔹 apply sorting in memory
  return sortPostsInMemory(results, sortField, sortOrder);
}


export async function searchUnifiedPostsByTag(
  tagSlug: string,
  sortField: SortField,
  sortOrder: SortOrder,
): Promise<UnifiedPost[]> {
  const q = tagSlug.trim();
  if (!q) return [];

  await connectMongo();

  const [apiPosts, dbPostsDocs] = await Promise.all([
    fetchPostsByTag(q), // API: /posts/tag/{slug}
    PostModel.find({
      // DB: tag must match (case-insensitive)
      tags: {
        $elemMatch: { $regex: `^${q}$`, $options: 'i' },
      },
    }).lean(),
  ]);

  const unifiedApi: UnifiedPost[] = apiPosts.map((p) => ({
    ...p,
    isCustom: false,
  }));

  const unifiedDb: UnifiedPost[] = dbPostsDocs.map(toUnifiedFromDb);

  // dedupe by id in final, API first
  const map = new Map<number, UnifiedPost>();
  for (const p of [...unifiedApi, ...unifiedDb]) {
    if (!map.has(p.id)) map.set(p.id, p);
  }

  const results = [...map.values()];

  // 🔹 apply sorting in memory
  return sortPostsInMemory(results, sortField, sortOrder);
}



/**
 * Thin wrapper for the API `/posts/sort` route:
 * just calls listUnifiedPostsPage with defaults for page/perPage.
 */
export async function sortUnifiedPosts(args: {
  sortField: SortField;
  sortOrder: SortOrder;
  page?: number;
  perPage?: number;
}) {
  const {
    sortField,
    sortOrder,
    page = 1,
    perPage = 25,
  } = args;

  return listUnifiedPostsPage({
    sortField,
    sortOrder,
    page,
    perPage,
  });
}
