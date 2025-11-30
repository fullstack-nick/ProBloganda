// app/actions/reactions.ts
'use server';

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { revalidateTag } from 'next/cache';
import { connectMongo } from '@/lib/mongodb';
import { PostModel } from '@/models/Post';
import { CommentModel } from '@/models/Comment';
import type { ReactionCounts } from '@/lib/types';

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

export async function reactToPostAction(
  postId: number,
  type: 'like' | 'dislike',
): Promise<{
  postId: number;
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
}> {
  const userId = await getCurrentDummyUserId();
  const userIdNum = Number(userId);

  await connectMongo();

  // Only custom posts are in Mongo; API posts remain read-only
  const postDoc = await PostModel.findOne({ id: postId });
  if (!postDoc) {
    throw new Error('Cannot react to non-custom (API) post');
  }

  // Ensure structures exist
  if (!postDoc.reactions) {
    postDoc.reactions = { likes: 0, dislikes: 0 } as ReactionCounts;
  }

  // userReactions may already exist (possibly with string userId), or not
  const docAny = postDoc as any;

  if (!Array.isArray(docAny.userReactions)) {
    docAny.userReactions = [];
  }

  const userReactions: { userId: any; type: 'like' | 'dislike' }[] =
    docAny.userReactions;

  // IMPORTANT: coerce both sides to Number in case older docs stored userId as string
  const existingIndex = userReactions.findIndex(
    (r) => Number(r.userId) === userIdNum,
  );
  const existing =
    existingIndex >= 0 ? userReactions[existingIndex] : null;

  let likesDelta = 0;
  let dislikesDelta = 0;
  let userReaction: 'like' | 'dislike' | null = null;

  if (!existing) {
    // First time reacting → add reaction
    userReactions.push({ userId: userIdNum, type });
    if (type === 'like') likesDelta = 1;
    else dislikesDelta = 1;
    userReaction = type;
  } else if (existing.type === type) {
    // Same reaction clicked again → remove reaction (un-react)
    userReactions.splice(existingIndex, 1);
    if (type === 'like') likesDelta = -1;
    else dislikesDelta = -1;
    userReaction = null;
  } else {
    // Switching like -> dislike or dislike -> like
    if (existing.type === 'like' && type === 'dislike') {
      likesDelta = -1;
      dislikesDelta = 1;
    } else if (existing.type === 'dislike' && type === 'like') {
      likesDelta = 1;
      dislikesDelta = -1;
    }
    existing.type = type;
    userReaction = type;
  }

  postDoc.reactions.likes += likesDelta;
  postDoc.reactions.dislikes += dislikesDelta;

  await postDoc.save();

  revalidateTag('posts', 'max');
  revalidateTag(`post:${postId}`, 'max');

  return {
    postId,
    likes: postDoc.reactions.likes,
    dislikes: postDoc.reactions.dislikes,
    userReaction,
  };
}

/* ---------- comment like toggle ---------- */
// (keep your likeCommentAction as you already have it)
export async function likeCommentAction(
  commentId: number,
): Promise<{
  commentId: number;
  postId: number;
  likes: number;
  likedByCurrentUser: boolean;
}> {
  const dummyUserId = await getCurrentDummyUserId();
  await connectMongo();

  const commentDoc = await CommentModel.findOne({ id: commentId });

  if (!commentDoc) {
    throw new Error('Cannot like non-custom (API) comment');
  }

  const likedBy: number[] = Array.isArray((commentDoc as any).likedBy)
    ? ((commentDoc as any).likedBy as number[])
    : [];

  const alreadyLiked = likedBy.includes(dummyUserId);

  if (alreadyLiked) {
    (commentDoc as any).likedBy = likedBy.filter(
      (id) => id !== dummyUserId,
    );
    commentDoc.likes = Math.max(0, commentDoc.likes - 1);
  } else {
    (commentDoc as any).likedBy = [...likedBy, dummyUserId];
    commentDoc.likes += 1;
  }

  const saved = await commentDoc.save();

  revalidateTag(`comments:${saved.postId}`, 'max');

  return {
    commentId: saved.id,
    postId: saved.postId,
    likes: saved.likes,
    likedByCurrentUser: !alreadyLiked,
  };
}
