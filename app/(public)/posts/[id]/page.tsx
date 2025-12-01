// app/(public)/posts/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getUnifiedPostById } from '@/lib/posts-service';
import { fetchApiUserBasic } from '@/lib/dummyjson';
import { listUnifiedCommentsForPost } from '@/lib/comments-service';
import { PostDetail } from '@/components/post-detail/PostDetail';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import type { UnifiedComment } from '@/lib/types';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  // ✅ unwrap params (Next 16: params is a Promise)
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const post = await getUnifiedPostById(id);
  if (!post) notFound();

  const [author, commentsRaw] = await Promise.all([
    fetchApiUserBasic(post.userId),
    listUnifiedCommentsForPost(id),
  ]);

  // ---- helper: try to get DummyJSON user id, but don't throw if missing ----
  async function getCurrentDummyUserId(): Promise<number | null> {
    const { isAuthenticated, getUser } = getKindeServerSession();

    if (!(await isAuthenticated())) {
      // Not logged in → no permissions, but page is still viewable
      return null;
    }

    const user = await getUser();
    const dummyProp = user?.properties?.kp_usr_campaign_id;
    const dummyUserId = dummyProp ? Number(dummyProp) : NaN;

    if (!Number.isFinite(dummyUserId)) {
      // Logged in but no mapping → treat as "no special permissions"
      return null;
    }

    return dummyUserId;
  }

  const currentDummyUserId = await getCurrentDummyUserId(); // number | null

  const canEditPost =
    currentDummyUserId != null &&
    !!post.isCustom &&
    post.userId === currentDummyUserId;

  const canDeletePost = canEditPost;

  type CommentWithPerms = UnifiedComment & {
    canEdit: boolean;
    canDelete: boolean;
  };

  const comments: CommentWithPerms[] = commentsRaw.map((c) => {
    const canEdit =
      currentDummyUserId != null &&
      !!c.isCustom &&
      'userId' in c &&
      c.userId === currentDummyUserId;

    return {
      ...(c as UnifiedComment),
      canEdit,
      canDelete: canEdit,
    };
  });

  const canComment = currentDummyUserId != null;

  return (
    <PostDetail
      post={post}
      author={author}
      comments={comments}
      canEditPost={canEditPost}
      canDeletePost={canDeletePost}
      canComment={canComment}
      currentUserId={currentDummyUserId}
    />
  );
}
