// lib/dummyjson.ts
import 'server-only';
import type {
  ApiPost,
  ApiComment,
  SortField,
  SortOrder,
} from './types';

const BASE = 'https://dummyjson.com';

const USERS_WITH_NO_POSTS = new Set<number>([
  3, 4, 8, 10, 14, 17, 20, 21, 22, 25, 27, 33, 38, 39, 40, 41, 42, 49, 50, 53,
  64, 68, 71, 75, 78, 85, 86, 96, 100, 103, 109, 111, 117, 119, 123, 129, 137,
  139, 141, 146, 147, 151, 153, 158, 160, 165, 166, 176, 186, 193, 194, 197,
  202,
]);

function noStore() {
  return { cache: 'no-store' as const };
}
function cached(revalidateSeconds = 3600) {
  return { next: { revalidate: revalidateSeconds } as const };
}

export async function fetchAllApiPosts(): Promise<ApiPost[]> {
  const res = await fetch(`${BASE}/posts?limit=0`, cached(86400));
  if (!res.ok) throw new Error('Failed to fetch posts');
  const data = await res.json();
  return data.posts;
}

export async function fetchApiPost(id: number): Promise<ApiPost> {
  const res = await fetch(`${BASE}/posts/${id}`, cached(86400));
  if (!res.ok) throw new Error('Post not found');
  return res.json();
}

export async function fetchApiCommentsForPost(
  postId: number,
): Promise<ApiComment[]> {
  const res = await fetch(`${BASE}/comments/post/${postId}`, cached(86400));
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Failed to fetch comments');
  const data = await res.json();
  return data.comments;
}

export async function fetchApiUserBasic(id: number) {
  const res = await fetch(
    `${BASE}/users/${id}?select=id,firstName,lastName,gender,birthDate,age,email,phone`,
    cached(86400)
  );

  if (!res.ok) throw new Error('User not found');

  const data = await res.json();

  return {
    ...data,
    fullName: `${data.firstName} ${data.lastName}`,
  };
}


export async function fetchAllAuthors() {
  const res = await fetch(
    `${BASE}/users?limit=0&select=firstName,lastName`,
    cached(86400),
  );
  if (!res.ok) throw new Error('Failed to fetch authors');
  const data = await res.json();
  // include id + fullName for search
  return (data.users as any[])
    .filter((u) => !USERS_WITH_NO_POSTS.has(u.id as number))
    .map((u) => ({
      id: u.id as number,
      firstName: u.firstName as string,
      lastName: u.lastName as string,
      fullName: `${u.firstName} ${u.lastName}`,
    }));
}

export async function fetchAuthorPosts(id: number): Promise<ApiPost[]> {
  const res = await fetch(`${BASE}/users/${id}/posts`, noStore());
  if (!res.ok) throw new Error('Failed to fetch author posts');
  const data = await res.json();
  return data.posts;
}

export async function fetchTags() {
  const res = await fetch(`${BASE}/posts/tags`, cached(86400));
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json() as Promise<
    { slug: string; name: string; url: string }[]
  >;
}

export async function fetchPostsByTag(slug: string): Promise<ApiPost[]> {
  const res = await fetch(`${BASE}/posts/tag/${slug}`, noStore());
  if (!res.ok) throw new Error('Tag posts fetch failed');
  const data = await res.json();
  return data.posts;
}

export async function searchApiPosts(
  q: string,
): Promise<ApiPost[]> {
  const [byTextRes, byTagRes] = await Promise.all([
    fetch(`${BASE}/posts/search?q=${encodeURIComponent(q)}`, noStore()),
    fetch(`${BASE}/posts/tag/${encodeURIComponent(q)}`, noStore()),
  ]);

  const [byText, byTag] = await Promise.all([
    byTextRes.ok ? byTextRes.json() : { posts: [] },
    byTagRes.ok ? byTagRes.json() : { posts: [] },
  ]);

  const map = new Map<number, ApiPost>();
  for (const p of [...byText.posts, ...byTag.posts]) {
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return [...map.values()];
}

export async function sortApiPosts(
  field: SortField,
  order: SortOrder,
): Promise<ApiPost[]> {
  const res = await fetch(
    `${BASE}/posts?sortBy=${field}&order=${order}&limit=0`,
    noStore(),
  );
  if (!res.ok) throw new Error('Failed to sort API posts');
  const data = await res.json();
  return data.posts;
}
