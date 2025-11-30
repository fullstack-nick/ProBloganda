// app/(protected)/posts/new/page.tsx
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import { NewPostForm } from '@/components/posts/NewPostForm';

export default async function NewPostPage() {
  const { isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    // or wherever you want to send unauthenticated users
    redirect('/posts');
  }

  return (
    <main className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Create new post</h1>
      <NewPostForm />
    </main>
  );
}
