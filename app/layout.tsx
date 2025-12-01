// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AuthProvider } from './AuthProvider';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'ProBloganda',
  description: 'ProBloganda Posts Blog',
};

type Theme = 'light' | 'dark';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value as Theme | undefined;
  const theme: Theme = themeCookie === 'light' ? 'light' : 'dark'; // default dark

  return (
    <html
      lang="en"
      className={theme === 'dark' ? 'dark' : ''}
    >
      <body>
        <AuthProvider>
          <Header initialTheme={theme} />
          <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
