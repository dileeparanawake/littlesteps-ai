import { NextResponse } from 'next/server';
import { threadTitleSchema } from '@/lib/validation/thread';
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

    const json = await req.json().catch(() => ({}));
    const parsed = threadTitleSchema.safeParse(json);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { threadId, title } = parsed.data;

    if (!(await userOwnsThread(threadId, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const renamedThread = await renameThread(
      session.user.id,
      threadId,
      title.trim(),
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
