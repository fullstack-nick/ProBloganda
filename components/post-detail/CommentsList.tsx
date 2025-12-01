// components/post-detail/CommentsList.tsx
'use client';

import { useTransition, useState, useEffect } from 'react';
import type { UnifiedComment } from '@/lib/types';
import {
  updateCommentAction,
  deleteCommentAction,
} from '@/app/actions/comments';
import { likeCommentAction } from '@/app/actions/reactions';

type CommentWithPerms = UnifiedComment & {
  canEdit: boolean;
  canDelete: boolean;
};

type Props = {
  postId: number;
  comments: CommentWithPerms[];
  onOptimisticUpdate(comment: CommentWithPerms): void;
  onOptimisticDelete(id: number): void;
  currentUserId: number | null;
};

export function CommentsList({
  postId,
  comments,
  onOptimisticUpdate,
  onOptimisticDelete,
  currentUserId,
}: Props) {
  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          postId={postId}
          comment={c}
          onOptimisticUpdate={onOptimisticUpdate}
          onOptimisticDelete={onOptimisticDelete}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

type ItemProps = {
  postId: number;
  comment: CommentWithPerms;
  onOptimisticUpdate(comment: CommentWithPerms): void;
  onOptimisticDelete(id: number): void;
  currentUserId: number | null;
};

function CommentItem({
  postId,
  comment,
  onOptimisticUpdate,
  onOptimisticDelete,
  currentUserId,
}: ItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);

  const [isPendingEdit, startEditTransition] = useTransition();
  const [isPendingLike, startLikeTransition] = useTransition();

  const initiallyLikedByMe = (() => {
    if (currentUserId == null) return false;

    const likedBy = (comment as any).likedBy as unknown;

    if (!Array.isArray(likedBy)) return false;

    // normalize to numbers, in case DB gives strings
    const likedByNumbers = likedBy.map((v) => Number(v));

    return likedByNumbers.includes(currentUserId);
  })();

  // local like UI state
  const [likesCount, setLikesCount] = useState(() => comment.likes);
  const [likedByMe, setLikedByMe] = useState(() => initiallyLikedByMe);

  useEffect(() => {
    setLikesCount(comment.likes);

    const likedBy = (comment as any).likedBy as unknown;
    if (
      currentUserId != null &&
      Array.isArray(likedBy) &&
      likedBy.map((v) => Number(v)).includes(currentUserId)
    ) {
      setLikedByMe(true);
    } else {
      setLikedByMe(false);
    }
  }, [comment.likes, (comment as any).likedBy, currentUserId]);


  const authorName =
    'user' in comment && comment.user
      ? comment.user.fullName
      : (comment as any).userFullName ?? 'Unknown';

  const canEditOrDelete = comment.canEdit || comment.canDelete;
  const canLike = !!comment.isCustom; // only custom comments are likeable

  function handleSave() {
    if (!comment.canEdit) return;
    const body = draft.trim();
    if (!body) {
      setError('Comment cannot be empty');
      return;
    }

    setError(null);

    const optimistic: CommentWithPerms = {
      ...comment,
      body,
    };
    onOptimisticUpdate(optimistic);
    setIsEditing(false);

    startEditTransition(async () => {
      try {
        await updateCommentAction({ id: comment.id, body });
      } catch (e: any) {
        setError(e.message || 'Failed to update');
      }
    });
  }

  function handleCancel() {
    setDraft(comment.body);
    setIsEditing(false);
    setError(null);
  }

  function handleDelete() {
    if (!comment.canDelete) return;
    if (!window.confirm('Delete this comment?')) return;

    // Optimistically remove from list
    onOptimisticDelete(comment.id);

    startEditTransition(async () => {
      try {
        await deleteCommentAction(comment.id);
      } catch {
        // could re-add if you stored it
      }
    });
  }

  function handleToggleLike() {
    if (!canLike || isPendingLike) return;

    setError(null);

    // ❗ No optimistic local bump – only update on success
    startLikeTransition(async () => {
      try {
        const res = await likeCommentAction(comment.id);
        setLikedByMe(res.likedByCurrentUser);
        setLikesCount(res.likes);
      } catch (err) {
        const msg =
          err instanceof Error
            ? 'Log in to add a reaction.'
            : 'Could not update reaction.';
        setError(msg);
        console.error(err);
      }
    });
  }

  return (
    <article className="border rounded-xl bg-[#fafcff] dark:bg-slate-800 px-3 py-2">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
        <span className='dark:text-slate-400'>{authorName}</span>
        <div className="flex items-center gap-2">
          {comment.isCustom && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400 dark:text-emerald-900">
              NEW
            </span>
          )}
          {canEditOrDelete && !isEditing && (
            <div className="flex gap-1">
              {comment.canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-1 py-0.5 rounded-full border bg-[#fafcff] dark:bg-slate-800 dark:text-slate-200 cursor-pointer select-none"
                >
                  Edit
                </button>
              )}
              {comment.canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-1 py-0.5 rounded-full border border-red-400 text-red-600 bg-[#fafcff] dark:bg-slate-800 cursor-pointer select-none"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          className="w-full border rounded-md px-2 py-1.5 text-sm min-h-[60px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <p className="text-sm text-slate-800 dark:text-slate-200">{comment.body}</p>
      )}

      <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-200">
        {/* ❤️ Like button for custom comments */}
        <button
          type="button"
          disabled={!canLike || isPendingLike}
          onClick={handleToggleLike}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border select-none ${
            !canLike
              ? 'opacity-40 cursor-default'
              : isPendingLike
              ? 'opacity-70'
              : 'cursor-pointer active:bg-pink-50 active:dark:bg-pink-900 sm:hover:bg-pink-50 sm:dark:hover:bg-pink-900'
          }`}
        >
          <span className={likedByMe ? 'text-pink-600' : 'text-slate-400'}>
            {likedByMe ? '❤️' : '🤍'}
          </span>
          <span>{likesCount}</span>
        </button>

        {isEditing && comment.canEdit && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPendingEdit}
              onClick={handleSave}
              className="px-2 py-0.5 rounded-full bg-gray-800 text-white disabled:opacity-60 cursor-pointer select-none"
            >
              {isPendingEdit ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-2 py-0.5 rounded-full border bg-[#fafcff] dark:bg-slate-800 cursor-pointer select-none"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </article>
  );
}
