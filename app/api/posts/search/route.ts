// app/api/posts/search/route.ts
import { NextResponse } from 'next/server';
import { searchUnifiedPosts } from '@/lib/posts-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const result = await searchUnifiedPosts(q);
  return NextResponse.json(result);
}
