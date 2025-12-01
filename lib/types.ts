// lib/types.ts

export type ReactionCounts = {
  likes: number;
  dislikes: number;
};

export type UserReaction = {
  userId: number;
  type: 'like' | 'dislike';
};

export type ApiPost = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: ReactionCounts;     // from DummyJSON
  userId: number;
};

export type CustomPost = {
  id: number;                    // continues after DummyJSON max id (e.g. 252+)
  title: string;
  body: string;
  tags: string[];
  reactions: ReactionCounts;     // mutable for custom posts
  userReactions?: UserReaction[];
  userId: number;                // DummyJSON user id used as authorId
  isCustom: true;
};

export type UnifiedPost =
  | (ApiPost & { isCustom?: false })
  | CustomPost;

export type ApiComment = {
  id: number;
  body: string;
  postId: number;
  likes: number;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
};

export type CustomComment = {
  id: number;
  body: string;
  postId: number;
  likes: number;
  likedBy: number[];
  userId: number;        // DummyJSON user id
  userFullName: string;  // denormalized for quick display
  isCustom: true;
};

export type UnifiedComment =
  | (ApiComment & { isCustom?: false })
  | CustomComment;

export type SortField = 'id' | 'title' | 'body';
export type SortOrder = 'asc' | 'desc'; // or 'newest'/'oldest' for UI
