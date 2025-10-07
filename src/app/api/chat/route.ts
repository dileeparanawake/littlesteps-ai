import { NextResponse } from 'next/server';

import { OpenAI } from 'openai';

import getServerSession from '@/lib/server-session';
import { SYSTEM_MESSAGE } from '@/lib/chat/system-message';
import { createThread } from '@/lib/chat/create-thread';
import { addMessageToThread } from '@/lib/chat/create-message';
import { getThreadMessages } from '@/lib/chat/read-thread-messages';

const client = new OpenAI();

let threadID: string | null = null;

export async function POST(req: Request) {
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

    // create thread if it doesn't exist
    if (!threadID) {
      const thread = await createThread(session.user.id);
      threadID = thread.id;
    }

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
