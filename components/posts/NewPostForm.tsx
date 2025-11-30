// components/posts/NewPostForm.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UnifiedPost } from '@/lib/types';
import { createPostAction } from '@/app/actions/posts';

type Props = {
  // Parent (PostsShell) will wire this into `useOptimistic` if needed
  onOptimisticCreate?: (post: UnifiedPost) => void;
};

export function NewPostForm({ onOptimisticCreate }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // After success message appears, redirect to /posts
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      router.push('/posts');
    }, 1200); // 1.2s to let user see the popup

    return () => clearTimeout(timer);
  }, [success, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const rawTags = tagsInput.trim();

    if (!trimmedTitle || !trimmedBody) {
      setError('Title and content are required');
      return;
    }

    const tags = rawTags
      ? rawTags
          .split(/[,\s]+/) // split by spaces or commas
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Temporary negative id so it won't clash with real ones
    const tempId = Date.now() * -1;

    const optimisticPost: UnifiedPost = {
      id: tempId,
      title: trimmedTitle,
      body: trimmedBody,
      tags,
      reactions: { likes: 0, dislikes: 0 },
      userId: -1, // dummy, never shown
      isCustom: true,
    };

    onOptimisticCreate?.(optimisticPost);

    startTransition(async () => {
      try {
        await createPostAction({
          title: trimmedTitle,
          body: trimmedBody,
          tags,
        });

        // Clear form
        setTitle('');
        setBody('');
        setTagsInput('');
        setSuccess('Post created successfully! Redirecting…');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to create post');
      }
    });
  }

  return (
    <>
      {/* Success popup overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-[#fafcff] dark:bg-slate-500 px-4 py-3 shadow-lg max-w-sm w-[90%] text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
              {success}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You’ll be taken back to the posts list.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-4 rounded-xl border bg-[#fafcff] dark:bg-slate-800 p-4 space-y-3"
      >
        <h2 className="font-semibold text-sm">Create a new post</h2>

        <div className="space-y-1">
          <label className="text-xs text-slate-600 dark:text-slate-200">Title</label>
          <input
            className="w-full border rounded-md px-2 py-1.5 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-600 dark:text-slate-200">Content</label>
          <textarea
            className="w-full border rounded-md px-2 py-1.5 text-sm min-h-[120px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-600 dark:text-slate-200">
            Tags (one word each, separated by space or comma)
          </label>
          <input
            className="w-full border rounded-md px-2 py-1.5 text-sm"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 rounded-full bg-gray-800 dark:bg-slate-900 text-white text-sm disabled:opacity-60"
        >
          {isPending ? 'Creating…' : 'Create post'}
        </button>
      </form>
    </>
  );
}
