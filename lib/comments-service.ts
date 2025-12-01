// lib/comments-service.ts
import 'server-only';
import { connectMongo } from './mongodb';
import { CommentModel } from '@/models/Comment';
import { fetchApiCommentsForPost } from './dummyjson';
import type { UnifiedComment, CustomComment } from './types';

const API_POST_COUNT = 251;
const API_COMMENTS_MAX_ID_GLOBAL = 340;

function toUnifiedCustom(doc: any): CustomComment {
  const rawLikedBy: Array<number | string> = Array.isArray(doc.likedBy)
  ? (doc.likedBy as Array<number | string>)
  : [];

  const likedBy: number[] = rawLikedBy
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  return {
    id: doc.id,
    body: doc.body,
    postId: doc.postId,
    likes: typeof doc.likes === 'number' ? doc.likes : 0,
    likedBy,
    userId: doc.userId,
    userFullName: doc.userFullName,
    isCustom: true,
  };
}

export async function listUnifiedCommentsForPost(
  postId: number,
): Promise<UnifiedComment[]> {
  await connectMongo();

  const [apiComments, customDocs] = await Promise.all([
    postId <= API_POST_COUNT
      ? fetchApiCommentsForPost(postId)
      : Promise.resolve([]), // no API comments for custom posts
    CommentModel.find({ postId }).sort({ id: 1 }).lean(),
  ]);

  const unifiedApi: UnifiedComment[] = apiComments.map((c) => ({
    ...c,
    isCustom: false,
  }));
  const unifiedCustom: UnifiedComment[] =
    customDocs.map(toUnifiedCustom);

  return [...unifiedApi, ...unifiedCustom];
}

// 🔧 FIXED: global comment id generator (ignores postId)
export async function getNextCustomCommentIdForPost(
  _postId: number,
): Promise<number> {
  await connectMongo();

  const last = await CommentModel.findOne()
    .sort({ id: -1 })
    .lean<{ id?: number }>();

  const maxDbId = last?.id ?? 0;

  // ensure we stay above all DummyJSON comment ids
  const base = Math.max(API_COMMENTS_MAX_ID_GLOBAL, maxDbId);

  return base + 1;
}

// Example server action to create a comment
export async function createCustomComment(params: {
  postId: number;
  body: string;
  userId: number;
  userFullName: string;
}) {
  const { postId, body, userId, userFullName } =
    params;

  await connectMongo();
  const id = await getNextCustomCommentIdForPost(postId);

  const doc = await CommentModel.create({
    id,
    postId,
    body,
    likes: 0,
    likedBy: [],
    userId,
    userFullName,
  });

  return toUnifiedCustom(doc.toObject());
}
