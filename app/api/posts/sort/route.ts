// app/api/posts/sort/route.ts
import { NextResponse } from 'next/server';
import { sortUnifiedPosts } from '@/lib/posts-service';
import type { SortField, SortOrder } from '@/lib/types';

export const dynamic = 'force-dynamic'; // always run on server, no static cache

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const fieldParam = (searchParams.get('field') ?? 'id') as SortField;  // 'id' not 'recency'
  const orderParam = (searchParams.get('order') ?? 'desc') as SortOrder;
  const pageParam = searchParams.get('page') ?? '1';
  const perPageParam = searchParams.get('perPage') ?? '25';

  const allowedFields: SortField[] = ['id', 'title', 'body'];
  const sortField: SortField = allowedFields.includes(fieldParam)
    ? fieldParam
    : 'id';

  const sortOrder: SortOrder = orderParam === 'asc' ? 'asc' : 'desc';

  const page = Number(pageParam);
  const perPage = Number(perPageParam);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePerPage =
    Number.isFinite(perPage) && perPage > 0 ? perPage : 25;

  try {
    const result = await sortUnifiedPosts({
      sortField,
      sortOrder,
      page: safePage,
      perPage: safePerPage,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to sort posts' },
      { status: 500 },
    );
  }
}
