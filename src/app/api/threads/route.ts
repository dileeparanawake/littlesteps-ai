import { NextResponse } from 'next/server';
import getServerSession from '@/lib/server-session';
import { getThreads } from '@/lib/chat/read-thread';
import { userOwnsThread } from '@/lib/chat/read-thread';
import { renameThread } from '@/lib/chat/update-thread';

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

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { threadId, title }: { threadId: string; title: string } =
      await req.json();

    if (typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Invalid title type' },
        { status: 400 },
      );
    }

    const trimmedTitle = title.trim();

    if (title.trim().length === 0 || title.length > 60) {
      return NextResponse.json(
        { error: 'Invalid title length' },
        { status: 400 },
      );
    }

    if (!(await userOwnsThread(threadId, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const renamedThread = await renameThread(
      session.user.id,
      threadId,
      trimmedTitle,
    );

    if (!renamedThread) {
      return NextResponse.json(
        { error: 'Failed to rename thread' },
        { status: 500 },
      );
    }

    return NextResponse.json(renamedThread, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
