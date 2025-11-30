// models/Comment.ts
import { Schema, model, models } from 'mongoose';

const CommentSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    postId: { type: Number, required: true },
    body: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: { type: [Number], default: [] },
    userId: { type: Number, required: true },        // DummyJSON author id
    userFullName: { type: String, required: true },  // for display
  },
  { timestamps: true },
);

export const CommentModel =
  models.Comment || model('Comment', CommentSchema);
