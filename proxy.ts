// middleware.ts
import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware';
import type { NextRequest } from 'next/server';

export default withAuth(
  async function middleware(_req: NextRequest) {},
  {
    // Public URLs (everything else is protected)
    publicPaths: [
      '/',
      '/posts',
      '/posts/:path*',
      '/tags',
      '/authors',
      '/authors/:path*',
    ],
  },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
