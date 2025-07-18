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
    if (typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }
    // TODO: add api call to openai.
    // stubbed response
    const fakeResponse = `Dummy response to: "${prompt}"`;

    return NextResponse.json({ response: fakeResponse });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
