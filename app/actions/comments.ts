// app/actions/comments.ts
'use server';

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { revalidateTag } from 'next/cache';
import { connectMongo } from '@/lib/mongodb';
import { CommentModel } from '@/models/Comment';
import { getNextCustomCommentIdForPost } from '@/lib/comments-service';
import { fetchApiUserBasic } from '@/lib/dummyjson';
import type { UnifiedComment } from '@/lib/types';

// Same helper idea as in posts.ts
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

// ---------- CREATE COMMENT (custom) ----------

type CreateCommentInput = {
  postId: number;
  body: string;
};

export async function createCommentAction(
  input: CreateCommentInput,
): Promise<UnifiedComment> {
  const dummyUserId = await getCurrentDummyUserId();

  const body = input.body.trim();
  if (!body) {
    throw new Error('Comment body is required');
  }

  const author = await fetchApiUserBasic(dummyUserId);

  await connectMongo();
  const id = await getNextCustomCommentIdForPost(input.postId);

  const doc = await CommentModel.create({
    id,
    postId: input.postId,
    body,
    likes: 0,
    likedBy: [],
    userId: dummyUserId,
    userFullName: author.fullName,
  });

  revalidateTag(`comments:${input.postId}`, 'max');
  // revalidateTag('posts');           // only if you show comment counts on list
  // revalidateTag(`post:${input.postId}`);

  const created: UnifiedComment = {
    id: doc.id,
    postId: doc.postId,
    body: doc.body,
    likes: doc.likes,
    likedBy: doc.likedBy ?? [],
    userId: doc.userId,
    userFullName: doc.userFullName,
    isCustom: true,
  };

  return created;
}

// ---------- UPDATE COMMENT (custom only) ----------

type UpdateCommentInput = {
  id: number;
  body: string;
};

export async function updateCommentAction(
  input: UpdateCommentInput,
): Promise<UnifiedComment> {
  const dummyUserId = await getCurrentDummyUserId();
  const newBody = input.body.trim();
  if (!newBody) {
    throw new Error('Comment body cannot be empty');
  }

  await connectMongo();

  const comment = await CommentModel.findOne({ id: input.id });
  if (!comment) {
    // No Mongo doc → API comment (read-only)
    throw new Error('Cannot edit non-custom (API) comment');
  }

  if (comment.userId !== dummyUserId) {
    throw new Error('You can edit only your own comments');
  }

  comment.body = newBody;
  const saved = await comment.save();

  revalidateTag(`comments:${saved.postId}`, 'max');
  // revalidateTag('posts');
  // revalidateTag(`post:${saved.postId}`);

  const updated: UnifiedComment = {
    id: saved.id,
    postId: saved.postId,
    body: saved.body,
    likes: saved.likes,
    likedBy: saved.likedBy ?? [],
    userId: saved.userId,
    userFullName: saved.userFullName,
    isCustom: true,
  };

  return updated;
}

// ---------- DELETE COMMENT (custom only) ----------

export async function deleteCommentAction(
  id: number,
): Promise<{ ok: true; postId: number }> {
  const dummyUserId = await getCurrentDummyUserId();
  await connectMongo();

  const comment = await CommentModel.findOne({ id });
  if (!comment) {
    throw new Error('Cannot delete non-custom (API) comment');
  }

  if (comment.userId !== dummyUserId) {
    throw new Error('You can delete only your own comments');
  }

  const postId = comment.postId;
  await comment.deleteOne();

  revalidateTag(`comments:${postId}`, 'max');
  // revalidateTag('posts');
  // revalidateTag(`post:${postId}`);

  return { ok: true, postId };
}
