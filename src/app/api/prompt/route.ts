// TODO: accept POST with {message: string}
// TODO: validate input - body has a message: string OR returns 404
// TODO: make fake response { response: "..." }
// TODO: return response
// TODO: test locally using postman

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const isMock = process.env['MOCK_API'] === 'true';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
  baseURL: isMock
    ? 'https://api.openai-mock.com/v1'
    : 'https://api.openai.com/v1',
});

console.log('Using mock:', isMock);
console.log('Base URL:', client.baseURL);

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // validate input
  try {
    // throw new Error('Simulated server failure'); // test server error
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }
    // TODO: add api call to openai.
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `${prompt}` },
      ],
    });

    console.log(completion.choices[0].message.content);

    // stubbed response
    const response = `Dummy response to: "${prompt}"`;

    return NextResponse.json({ response: response }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
