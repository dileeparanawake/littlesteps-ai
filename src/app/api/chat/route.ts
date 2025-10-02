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

    // throw new Error('Simulated server failure'); // test server error
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    if (!threadID) {
      const thread = await createThread(session.user.id);
      threadID = thread.id;
    }

    await addMessageToThread(threadID, 'user', prompt);

    const messages = await getThreadMessages(threadID);

    // console.log('Messages:\n', messages, '\n');

    const messagesContent = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // console.log('Messages content:\n', messagesContent, '\n');

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: messagesContent,
      reasoning_effort: 'minimal',
    });

    // console.log('Open AI completion:\n\n\n', completion);

    // console.log('Open AI choices content:\n', completion.choices[0]);
    // console.log('Open AI response:', completion.choices[0].message.content);

    const assistantMessage = await addMessageToThread(
      threadID,
      'assistant',
      completion.choices[0].message.content,
    );

    // console.log('Assistant message:\n', assistantMessage, '\n');

    const response = await getThreadMessages(threadID);

    // console.log('Response:\n', response, '\n');

    return NextResponse.json({ response: response }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
