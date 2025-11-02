import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@/lib/openai';

export async function POST(req: Request): Promise<NextResponse> {
  const { prompt } = await req.json();

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: String(prompt ?? ''),
  });

  return NextResponse.json({ text });
}


