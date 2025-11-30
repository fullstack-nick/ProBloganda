// app/(protected)/profile/page.tsx
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { fetchApiUserBasic } from '@/lib/dummyjson';
import { PostsList } from '@/components/posts/PostsList';
import { listUnifiedPostsByAuthor } from '@/lib/posts-service';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  async function getCurrentDummyUserId() {
    const { isAuthenticated, getUser } = getKindeServerSession();

    if (!(await isAuthenticated())) {
      redirect('/posts');
    }

    const user = await getUser();
    const dummyProp = user?.properties?.kp_usr_campaign_id;
    const dummyUserId = dummyProp ? Number(dummyProp) : NaN;

    if (!Number.isFinite(dummyUserId)) {
      throw new Error('No mapped DummyJSON user id for this user');
    }

    return dummyUserId;
  }

  const dummyUserId: number = await getCurrentDummyUserId();

  const [dummyUser, myPosts] = await Promise.all([
    fetchApiUserBasic(dummyUserId),
    listUnifiedPostsByAuthor(dummyUserId),   // 👈 unified API + DB posts
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">My profile</h1>
      <div className="border rounded-xl bg-[#fafcff] dark:bg-slate-800 p-4 space-y-1 text-sm">
        <p>
          <span className="font-medium">Name: </span>
          {dummyUser.fullName}
        </p>
        <p>
          <span className="font-medium">Gender: </span>
          {dummyUser.gender}
        </p>
        <p>
          <span className="font-medium">Birth date: </span>
          {dummyUser.birthDate}
        </p>
        <p>
          <span className="font-medium">Age: </span>
          {dummyUser.age}
        </p>
        <p>
          <span className="font-medium">Email: </span>
          {dummyUser.email}
        </p>
        <p>
          <span className="font-medium">Phone: </span>
          {dummyUser.phone}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">My posts</h2>
        {/* Already UnifiedPost[], so no extra mapping needed */}
        <PostsList posts={myPosts} />
      </div>
    </section>
  );
}
