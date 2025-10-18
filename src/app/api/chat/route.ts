import { NextResponse } from 'next/server';

import { OpenAI } from 'openai';

import getServerSession from '@/lib/server-session';

import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import {
  getThreadMessages,
  getThreads,
  userOwnsThread,
} from '@/lib/chat/read-thread';

const client = new OpenAI();

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const existingThreadId = searchParams.get('threadId');
  const { prompt } = await req.json();

  const session = await getServerSession();
  // console.log('User session:', session?.user?.email ?? 'no session');

  // validate input
  try {
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 },
      );
    }

    // throw error if prompt is not a string or is empty
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    // If a threadId is passed, reuse it; otherwise, create a new one
    const threadID = existingThreadId
      ? existingThreadId
      : (await createThread(session.user.id)).id;

    // add user prompt to thread
    await addMessageToThread(threadID, 'user', prompt);

    // get thread messages
    const messages = await getThreadMessages(threadID);

    // map messages to messages content
    const messagesContent = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // get open ai response (assistant message)
    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: messagesContent,
      reasoning_effort: 'minimal',
    });

    // add assistant message to thread
    await addMessageToThread(
      threadID,
      'assistant',
      completion.choices[0].message.content,
    );

    return NextResponse.json({ threadID }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');
    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
    }

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isUserOwner = await userOwnsThread(threadId, session.user.id);
    if (!isUserOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch messages for this
    const messages = await getThreadMessages(threadId);

    return NextResponse.json(messages, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
