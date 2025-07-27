// TODO: accept POST with {message: string}
// TODO: validate input - body has a message: string OR returns 404
// TODO: make fake response { response: "..." }
// TODO: return response
// TODO: test locally using postman

import { NextResponse } from 'next/server';

import { OpenAI } from 'openai';

import getServerSession from '@/lib/server-session';

const isMock = process.env['MOCK_API'] === 'true';

const client = new OpenAI({
  apiKey: isMock
    ? process.env['OPENAI_API_KEY_MOCK']
    : process.env['OPENAI_API_KEY'],
  baseURL: isMock
    ? 'https://api.openai-mock.com/v1'
    : 'https://api.openai.com/v1',
});

console.log('Using mock:', isMock);
console.log('Base URL:', client.baseURL);

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const session = await getServerSession();
  console.log('User session:', session?.user?.email ?? 'no session');

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

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-nano', // TODO: change to gpt-4.1-nano
      messages: [
        {
          role: 'system',
          content:
            'You are a UK‑based child development specialist (birth to 24 months). Use up‑to‑date NHS guidance and high‑quality scientific research to help parents understand, track and support their child’s developmental milestones. Never hallucinate. Use friendly, supportive language, explain technical terms, keep tone clear  (UK English). Respond in plain text. Use plain textbullet points and paragraphs, where possible. Keep your response short and concise. Ask clarifying questions when needed. Tailor advice to age and individual needs.',
        },
        { role: 'user', content: `${prompt}` },
      ],
    });

    console.log('Open AI response:', completion.choices[0].message.content);

    const response = `Response: ${completion.choices[0].message.content} Prompt: "${prompt}"`;

    return NextResponse.json({ response: response }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
