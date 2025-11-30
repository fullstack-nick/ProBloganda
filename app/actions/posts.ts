// app/actions/posts.ts
'use server';

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { revalidateTag } from 'next/cache';
import { connectMongo } from '@/lib/mongodb';
import { PostModel } from '@/models/Post';
import { getNextCustomPostId } from '@/lib/posts-service';
import type { UnifiedPost } from '@/lib/types';

// Helper: map Kinde user -> DummyJSON userId
async function getCurrentDummyUserId() {
  const { isAuthenticated, getUser } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    throw new Error('Not authenticated');
  }

  const user = await getUser();
  const dummyProp = user?.properties?.kp_usr_campaign_id;
  const dummyUserId = dummyProp ? Number(dummyProp) : NaN;

  if (!Number.isFinite(dummyUserId)) {
    throw new Error('No mapped DummyJSON user id for this user');
  }

  return dummyUserId;
}

// ---------- CREATE POST (already discussed, here for completeness) ----------

type CreatePostInput = {
  title: string;
  body: string;
  tags: string[];
};

export async function createPostAction(
  input: CreatePostInput,
): Promise<{ ok: true; id: number }> {
  const dummyUserId = await getCurrentDummyUserId();

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title || !body) {
    throw new Error('Title and content are required');
  }

  const cleanTags = input.tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/\s+/g, '-')); // enforce single-word-ish tags

  await connectMongo();
  const id = await getNextCustomPostId();

  const doc = await PostModel.create({
    id,
    title,
    body,
    tags: cleanTags,
    userId: dummyUserId,
    reactions: { likes: 0, dislikes: 0 },
  });

  revalidateTag('posts', 'max');
  revalidateTag(`post:${id}`, 'max');

  const created: UnifiedPost = {
    id: doc.id,
    title: doc.title,
    body: doc.body,
    tags: doc.tags,
    reactions: doc.reactions,
    userId: doc.userId,
    isCustom: true,
  };

  return { ok: true, id: doc.id as number };
}

// ---------- UPDATE POST (custom only) ----------

type UpdatePostInput = {
  id: number;
  title?: string;
  body?: string;
  tags?: string[];
};

export async function updatePostAction(
  input: UpdatePostInput,
): Promise<UnifiedPost> {
  const dummyUserId = await getCurrentDummyUserId();
  await connectMongo();

  const post = await PostModel.findOne({ id: input.id });
  if (!post) {
    // No Mongo doc → this is probably an API post (read-only)
    throw new Error('Cannot edit non-custom (API) post');
  }

  // Permission check
  if (post.userId !== dummyUserId) {
    throw new Error('You can edit only your own posts');
  }

  if (typeof input.title === 'string') {
    const t = input.title.trim();
    if (!t) throw new Error('Title cannot be empty');
    post.title = t;
  }

  if (typeof input.body === 'string') {
    const b = input.body.trim();
    if (!b) throw new Error('Content cannot be empty');
    post.body = b;
  }

  if (Array.isArray(input.tags)) {
    const cleanTags = input.tags
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.replace(/\s+/g, '-'));
    post.tags = cleanTags;
  }

  const saved = await post.save();

  revalidateTag('posts', 'max');
  revalidateTag(`post:${saved.id}`, 'max');

  const updated: UnifiedPost = {
    id: saved.id as number,
    title: saved.title as string,
    body: saved.body as string,
    tags: (saved.tags as string[]) ?? [],
    reactions: {
      likes: (saved.reactions as any)?.likes ?? 0,
      dislikes: (saved.reactions as any)?.dislikes ?? 0,
    },
    userId: saved.userId as number,
    isCustom: true,
  };

  return updated;
}

// ---------- DELETE POST (custom only) ----------

export async function deletePostAction(
  id: number,
): Promise<{ ok: true }> {
  const dummyUserId = await getCurrentDummyUserId();
  await connectMongo();

  const post = await PostModel.findOne({ id });
  if (!post) {
    throw new Error('Cannot delete non-custom (API) post');
  }

  if (post.userId !== dummyUserId) {
    throw new Error('You can delete only your own posts');
  }

  await post.deleteOne();

  // Optional: also delete this post's custom comments
  // (API comments remain as they are)
  const { CommentModel } = await import('@/models/Comment');
  await CommentModel.deleteMany({ postId: id });

  revalidateTag('posts', 'max');
  revalidateTag(`post:${id}`, 'max');
  revalidateTag(`comments:${id}`, 'max');

  return { ok: true };
}
