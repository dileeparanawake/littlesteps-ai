import { NextResponse } from 'next/server';

import getServerSession from '@/lib/server-session';
import {
  enforceAccess,
  handleAccessDenial,
} from '@/lib/access-control/enforce';
import { assertSessionHasUser } from '@/lib/access-control/assert-session-user';

import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { getThreadMessages, userOwnsThread } from '@/lib/chat/read-thread';
import { OpenAIResponseService } from '@/lib/ai/openai-response-service';
import { enforceUsageLimit } from '@/lib/chat/usage-limit';

export async function POST(req: Request) {
  try {
    // 1. Authenticate: get session
    const session = await getServerSession();

    // 2. Authorize: route-level access control (fail-fast)
    const accessResult = enforceAccess('/api/chat', session);
    const denialResponse = handleAccessDenial(accessResult);
    if (denialResponse) {
      return denialResponse;
    }

    // 3. Assert session shape: ensure session.user exists
    assertSessionHasUser(session);
    const userId = session.user.id;

    // 3a. Usage limit check: verify user hasn't exceeded weekly token cap
    const usageDenialResponse = await enforceUsageLimit(session);
    if (usageDenialResponse) {
      return usageDenialResponse;
    }

    // 4. Parse and validate input
    const { searchParams } = new URL(req.url);
    const existingThreadId = searchParams.get('threadId');
    const { prompt } = await req.json();

    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    // 5. Resource ownership check: verify user owns thread before reusing it
    if (existingThreadId) {
      const owns = await userOwnsThread(existingThreadId, userId);
      if (!owns) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 6. Business logic: create or reuse thread
    const threadID = existingThreadId
      ? existingThreadId
      : (await createThread(userId)).id;

    // add user prompt to thread
    await addMessageToThread(threadID, 'user', prompt);

    // get thread messages
    const messages = await getThreadMessages(threadID);

    // map messages to messages content
    const messagesContent = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // 7. External calls: AI adapter
    const aiResponse = await OpenAIResponseService.generateResponse(
      messagesContent,
      {
        threadId: threadID,
      },
    );

    // add assistant message to thread
    await addMessageToThread(
      threadID,
      'assistant',
      aiResponse.content,
      ...(aiResponse.usage ? [aiResponse.usage] : []),
    );

    // 8. Respond
    return NextResponse.json({ threadID }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    // Enforce access control via centralized policy
    const accessResult = enforceAccess('/api/chat', session);
    const denialResponse = handleAccessDenial(accessResult);
    if (denialResponse) {
      return denialResponse;
    }

    // After access control passes, assert session.user exists
    assertSessionHasUser(session);

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
    }

    const isUserOwner = await userOwnsThread(threadId, session.user.id);
    if (!isUserOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch messages for this thread
    const messages = await getThreadMessages(threadId);

    return NextResponse.json(messages, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
