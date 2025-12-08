import { NextResponse } from 'next/server';
import { threadTitleSchema, threadIdSchema } from '@/lib/validation/thread';
import getServerSession from '@/lib/server-session';
import {
  enforceAccess,
  handleAccessDenial,
} from '@/lib/access-control/enforce';
import { getThreads } from '@/lib/chat/read-thread';
import { userOwnsThread } from '@/lib/chat/read-thread';
import { renameThread } from '@/lib/chat/update-thread';
import { deleteThread } from '@/lib/chat/delete-thread';

export async function GET() {
  try {
    const session = await getServerSession();

    // Enforce access control via centralized policy
    const accessResult = enforceAccess('/api/threads', session);
    const denialResponse = handleAccessDenial(accessResult);
    if (denialResponse) {
      return denialResponse;
    }

    const threads = await getThreads(session!.user!.id);

    return NextResponse.json(threads, { status: 200 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error?.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();

    // Enforce access control via centralized policy
    const accessResult = enforceAccess('/api/threads', session);
    const denialResponse = handleAccessDenial(accessResult);
    if (denialResponse) {
      return denialResponse;
    }

    const json = await req.json().catch(() => ({}));
    const parsed = threadTitleSchema.safeParse(json);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { threadId, title } = parsed.data;

    if (!(await userOwnsThread(threadId, session!.user!.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const renamedThread = await renameThread(
      session!.user!.id,
      threadId,
      title,
    );

    if (!renamedThread) {
      return NextResponse.json(
        { error: 'Failed to rename thread' },
        { status: 500 },
      );
    }

    return NextResponse.json(renamedThread, { status: 200 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error?.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = threadIdSchema.safeParse(json);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { threadId } = parsed.data;

    if (!(await userOwnsThread(threadId, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deletedThread = await deleteThread(session.user.id, threadId);

    if (!deletedThread.success) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error?.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
