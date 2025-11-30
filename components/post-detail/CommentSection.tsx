// components/post-detail/CommentSection.tsx
'use client';

import { useState, useTransition } from 'react';
import type { UnifiedComment } from '@/lib/types';
import { createCommentAction } from '@/app/actions/comments';
import { CommentsList } from './CommentsList';

type CommentWithPerms = UnifiedComment & {
  canEdit: boolean;
  canDelete: boolean;
};

type Props = {
  postId: number;
  initialComments: CommentWithPerms[];
  canComment: boolean;
  onCommentsChange?: (count: number) => void; // 🔹 NEW
};

export function CommentSection({
  postId,
  initialComments,
  canComment,
  onCommentsChange,
}: Props) {
  const [comments, setComments] =
    useState<CommentWithPerms[]>(initialComments);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = body.trim();
    if (!trimmed) {
      setError('Comment cannot be empty');
      return;
    }

    const tempId = Date.now() * -1;

    const optimistic: CommentWithPerms = {
      id: tempId,
      postId,
      body: trimmed,
      likes: 0,
      userId: -1,
      userFullName: 'You',
      isCustom: true,
      canEdit: true,
      canDelete: true,
    };

    // 1) Optimistic add
    startTransition(() => {
      setComments((prev) => {
        const next = [...prev, optimistic];
        onCommentsChange?.(next.length);  // 🔹 inform parent
        return next;
      });
    });

    try {
      // 2) Call server action
      const saved = await createCommentAction({
        postId,
        body: trimmed,
      });

      // 3) Replace temp comment with real one (count unchanged)
      startTransition(() => {
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? {
                  ...saved,
                  canEdit: true,
                  canDelete: true,
                }
              : c,
          ),
        );
      });

      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');

      // 4) Remove optimistic comment on error
      startTransition(() => {
        setComments((prev) => {
          const next = prev.filter((c) => c.id !== tempId);
          onCommentsChange?.(next.length); // 🔹 inform parent
          return next;
        });
      });
    }
  }

  // Called by CommentsList after it has computed the updated comment
  function handleOptimisticUpdate(comment: CommentWithPerms) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id ? comment : c,
      ),
    );
    // no count change here
  }

  // Called by CommentsList for delete
  function handleOptimisticDelete(id: number) {
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== id);
      onCommentsChange?.(next.length);   // 🔹 inform parent
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <CommentsList
        postId={postId}
        comments={comments}
        onOptimisticUpdate={handleOptimisticUpdate}
        onOptimisticDelete={handleOptimisticDelete}
      />

      {canComment ? (
        <form onSubmit={handleCreate} className="space-y-2">
          <textarea
            className="w-full border rounded-md px-2 py-1.5 text-sm min-h-20"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
          />
          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 rounded-full bg-gray-800 text-white text-sm disabled:opacity-50 cursor-pointer select-none"
          >
            {isPending ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="text-xs text-slate-500">
          Log in to add a comment.
        </p>
      )}
    </div>
  );
}
