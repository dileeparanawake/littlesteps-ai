// TODO: accept POST with {message: string}
// TODO: validate input - body has a message: string OR returns 404
// TODO: make fake response { response: "..." }
// TODO: return response
// TODO: test locally using postman

import { NextResponse } from 'next/server';

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
    // stubbed response
    const response = `Dummy response to: "${prompt}"`;

    return NextResponse.json({ response: response }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
