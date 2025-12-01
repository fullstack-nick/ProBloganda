// components/posts/PostReactions.tsx
'use client';

import { useState, useTransition } from 'react';
import type { UnifiedPost } from '@/lib/types';
import { reactToPostAction } from '@/app/actions/reactions';

type Props = {
  post: UnifiedPost;
  compact?: boolean;
  /** when true (in list view) the buttons are decorative only */
  stopNavigation?: boolean;
};

export function PostReactions({
  post,
  compact,
  stopNavigation,
}: Props) {
  const isCustom = !!post.isCustom;

  const [likes, setLikes] = useState(post.reactions.likes);
  const [dislikes, setDislikes] = useState(post.reactions.dislikes);
  const [userReaction, setUserReaction] = useState<
    'like' | 'dislike' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReact(type: 'like' | 'dislike') {
    // List view: counts are read-only, clicking should just follow the parent <Link>.
    if (stopNavigation) return;

    if (!isCustom || isPending) return;

    setError(null);

    startTransition(async () => {
      try {
        const res = await reactToPostAction(post.id, type);
        setLikes(res.likes);
        setDislikes(res.dislikes);
        setUserReaction(res.userReaction);
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

  const layout = compact ? 'gap-1' : 'gap-2';

  return (
    <div className="space-y-1">
      <div className={`flex items-center ${layout}`}>
        <ReactionButton
          type="like"
          count={likes}
          disabled={!isCustom || isPending}
          active={userReaction === 'like'}
          stopNavigation={stopNavigation}
          isCustom={isCustom}
          onClick={() => handleReact('like')}
        />
        <ReactionButton
          type="dislike"
          count={dislikes}
          disabled={!isCustom || isPending}
          active={userReaction === 'dislike'}
          stopNavigation={stopNavigation}
          isCustom={isCustom}
          onClick={() => handleReact('dislike')}
        />
      </div>

      {error && (
        <p className="text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type ReactionButtonProps = {
  type: 'like' | 'dislike';
  count: number;
  disabled?: boolean;
  active?: boolean;
  stopNavigation?: boolean;
  isCustom: boolean;
  onClick(): void;
};

function ReactionButton({
  type,
  count,
  disabled,
  active,
  stopNavigation,
  isCustom,
  onClick,
}: ReactionButtonProps) {
  const label = type === 'like' ? '👍' : '👎';

  function handleClick(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    // In list view we don’t handle the click here at all –
    // it bubbles up to the wrapping <Link> and navigates.
    if (stopNavigation) return;

    if (disabled) return;
    onClick();
  }

  const base =
    'bg-[#fafcff] dark:bg-slate-800 inline-flex items-center px-2 py-0.5 rounded-full border text-xs select-none ';

  const stateClass = stopNavigation
    ? // List view: bright, decorative, click goes to parent <Link>
      (isCustom
        ? 'cursor-pointer border-slate-900 text-slate-900'
        : 'border-slate-900 text-slate-900')
    : disabled
    ? 'opacity-60 cursor-default'
    : isCustom
    ? 'cursor-pointer hover:scale-105 active:scale-95 transition'
    : 'hover:scale-105 active:scale-95 transition';

  const activeClass =
    active && !stopNavigation ? ' bg-slate-900 text-white' : '';

  return (
    <button
      type="button"
      // never disable in list view so the click can bubble to <Link>
      disabled={disabled && !stopNavigation}
      onClick={handleClick}
      className={base + stateClass + activeClass}
    >
      <span className="mr-1">{label}</span>
      <span>{count}</span>
    </button>
  );
}
