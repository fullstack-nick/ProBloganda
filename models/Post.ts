// models/Post.ts
import { Schema, models, model } from 'mongoose';
import type { ReactionCounts } from '@/lib/types';

type UserReaction = {
  userId: number;
  type: 'like' | 'dislike';
};

const ReactionsSchema = new Schema<ReactionCounts>(
  {
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  {
    _id: false, // 👈 prevent nested _id on reactions
  },
);

// Per-user reaction stored inside the post document
const UserReactionSchema = new Schema<UserReaction>(
  {
    userId: { type: Number, required: true }, // Kinde user id (string)
    type: {
      type: String,
      enum: ['like', 'dislike'],
      required: true,
    },
  },
  {
    _id: false,
  },
);

const PostSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true }, // matches API-style numeric id
    title: { type: String, required: true },
    body: { type: String, required: true },
    tags: [{ type: String, required: true }],

    // Aggregated counts
    reactions: {
      type: ReactionsSchema,
      default: () => ({ likes: 0, dislikes: 0 }),
    },

    // Per-user reactions (for "only one reaction per user")
    userReactions: {
      type: [UserReactionSchema],
      default: [],
    },

    userId: { type: Number, required: true }, // DummyJSON author id
  },
  { timestamps: true },
);

export const PostModel =
  models.Post || model('Post', PostSchema);
