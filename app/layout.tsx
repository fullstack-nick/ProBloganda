// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from './AuthProvider';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'ProBloganda',
  description: 'ProBloganda Posts Blog',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
