import { NextResponse } from 'next/server';
import getServerSession from '@/lib/server-session';
import { getThreads } from '@/lib/chat/read-thread';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const threads = await getThreads(session.user.id);

    return NextResponse.json(threads, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
