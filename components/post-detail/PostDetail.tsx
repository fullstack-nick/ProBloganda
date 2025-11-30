// components/post-detail/PostDetail.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UnifiedPost, UnifiedComment } from '@/lib/types';
import { PostReactions } from '@/components/posts/PostReactions';
import { CommentSection } from './CommentSection';
import {
  updatePostAction,
  deletePostAction,
} from '@/app/actions/posts';

type Author = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  gender?: string;
  birthDate?: string;
  age?: number;
  email?: string;
  phone?: string;
};

type CommentWithPerms = UnifiedComment & {
  canEdit: boolean;
  canDelete: boolean;
};

type Props = {
  post: UnifiedPost;
  author: Author;
  comments: CommentWithPerms[];
  canEditPost: boolean;
  canDeletePost: boolean;
  canComment: boolean;
};

export function PostDetail({
  post,
  author,
  comments,
  canEditPost,
  canDeletePost,
  canComment,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayPost, setDisplayPost] = useState(post);
  const [titleDraft, setTitleDraft] = useState(post.title);
  const [bodyDraft, setBodyDraft] = useState(post.body);
  const [tagsDraft, setTagsDraft] = useState(post.tags.join(' ')); // space-separated
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 🔹 local comment count, kept in sync with CommentSection
  const [commentCount, setCommentCount] = useState(comments.length);

  async function handleSave() {
    setError(null);

    const title = titleDraft.trim();
    const body = bodyDraft.trim();
    const tagsArray = tagsDraft
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (!title || !body) {
      setError('Title and content are required');
      return;
    }

    // optimistic update: update local display immediately
    const optimistic = {
      ...displayPost,
      title,
      body,
      tags: tagsArray,
    };
    setDisplayPost(optimistic);
    setIsEditing(false);

    startTransition(async () => {
      try {
        await updatePostAction({
          id: post.id,
          title,
          body,
          tags: tagsArray,
        });
      } catch (e: any) {
        setError(e.message || 'Failed to save changes');
        // we keep optimistic view; you could also revert if you want
      }
    });
  }

  function handleCancel() {
    setTitleDraft(displayPost.title);
    setBodyDraft(displayPost.body);
    setTagsDraft(displayPost.tags.join(' '));
    setIsEditing(false);
    setError(null);
  }

  function handleDelete() {
    if (!canDeletePost) return;
    if (!window.confirm('Delete this post?')) return;

    // optimistic removal: navigate away immediately
    router.push('/posts');

    startTransition(async () => {
      try {
        await deletePostAction(post.id);
      } catch {
        // If delete fails, we've already navigated away; you might show a toast elsewhere.
      }
    });
  }

  const canEditOrDelete = canEditPost || canDeletePost;

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        {isEditing ? (
          <input
            className="w-full border rounded-md px-2 py-1.5 text-xl font-semibold"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
          />
        ) : (
          <h1 className="text-2xl font-bold">
            {displayPost.title}
          </h1>
        )}

        <div className="text-sm text-slate-600 dark:text-slate-200 flex flex-wrap gap-2 items-center">
          <span>By</span>
          <Link
            href={`/authors/${author.id}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {author.fullName}
          </Link>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 items-center">
          {isEditing ? (
            <input
              className="border rounded-md px-2 py-1 text-xs w-full max-w-xs"
              value={tagsDraft}
              onChange={(e) => setTagsDraft(e.target.value)}
              placeholder="tags separated by space or comma"
            />
          ) : (
            <>
              {displayPost.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/posts?tag=${encodeURIComponent(tag)}`}
                  className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-800"
                >
                  #{tag}
                </Link>
              ))}
              {displayPost.isCustom && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400 dark:text-emerald-900">
                  NEW
                </span>
              )}
            </>
          )}
        </div>

        {/* Post-level actions */}
        {canEditOrDelete && (
          <div className="flex gap-2 items-center text-xs mt-1">
            {canEditPost && (
              <>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-2 py-1 rounded-full border bg-[#fafcff] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer select-none"
                  >
                    Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSave}
                      className="px-2 py-1 rounded-full bg-gray-800 dark:bg-slate-600 text-white disabled:opacity-60 cursor-pointer select-none"
                    >
                      {isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-2 py-1 rounded-full border bg-[#fafcff] dark:bg-slate-800 cursor-pointer select-none"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
            {canDeletePost && !isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-2 py-1 rounded-full border border-red-400 text-red-600 bg-[#fafcff] dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-900 cursor-pointer select-none"
              >
                Delete
              </button>
            )}
            {error && (
              <span className="text-red-600 text-xs">
                {error}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Body */}
      <section className="prose max-w-none">
        {isEditing ? (
          <textarea
            className="w-full border rounded-md px-2 py-1.5 text-sm min-h-[200px]"
            value={bodyDraft}
            onChange={(e) => setBodyDraft(e.target.value)}
          />
        ) : (
          <p>{displayPost.body}</p>
        )}
      </section>

      <div className="flex items-center justify-between mt-4">
        <PostReactions post={displayPost} />
      </div>

      <section className="mt-6 space-y-3">
        <h2 className="font-semibold text-lg">
          {/* 🔹 use reactive count instead of initial comments.length */}
          Comments ({commentCount})
        </h2>
        <CommentSection
          postId={post.id}
          initialComments={comments}
          canComment={canComment}
          // 🔹 keep parent in sync whenever comment list changes
          onCommentsChange={setCommentCount}
        />
      </section>
    </article>
  );
}
