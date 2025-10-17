import { NextResponse } from 'next/server';
import getServerSession from '@/lib/server-session';
import { getThreads } from '@/lib/chat/read-thread';

export async function GET(req: Request) {
  const session = await getServerSession();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!session?.user || !userId || userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threads = await getThreads(session.user.id);

  return NextResponse.json(threads, { status: 200 });
}
