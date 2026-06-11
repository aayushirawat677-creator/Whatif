content = """import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.AZURE_AI_FOUNDRY_API_KEY,
  baseURL: process.env.AZURE_AI_FOUNDRY_ENDPOINT,
  defaultHeaders: {
    'anthropic-version': '2023-06-01',
  },
});

const DEPLOYMENT = process.env.AZURE_AI_DEPLOYMENT || 'claude-haiku-4-5';

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await client.messages.create({
    model: DEPLOYMENT,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return (response.content[0] as { type: string; text: string }).text;
}

export async function POST(req: NextRequest) {
  try {
    const { decision } = await req.json();
    if (!decision || decision.length < 10) {
      return NextResponse.json({ error: 'Decision too short' }, { status: 400 });
    }

    const paths = [
      { id: 1, label: 'Stay the course', road: 'left' },
      { id: 2, label: 'Take the leap', road: 'center' },
      { id: 3, label: 'Find the middle way', road: 'right' },
    ];

    const timelinePromises = paths.map(async (path) => {
      try {
        const systemPrompt = 'You are a wise narrator helping someone see their future clearly. Write vivid, specific, emotionally honest timelines. Always respond in valid JSON only.';
        const userMessage = 'Decision: "' + decision + '"\\nPath: "' + path.label + '"\\n\\nWrite a timeline for this path. Respond ONLY in JSON: {"summary": "2-4 word label", "detail": "Three paragraphs in second person. Para 1: 6 months. Para 2: 2 years. Para 3: 5 years. Be specific and emotionally resonant."}';
        const response = await callClaude(systemPrompt, userMessage);
        const clean = response.replace(/```json|```/g, '').trim();
        const timeline = JSON.parse(clean);
        return {
          id: path.id,
          label: 'Possibility ' + path.id,
          summary: timeline.summary || path.label,
          detail: timeline.detail,
          road: path.road,
        };
      } catch {
        return {
          id: path.id,
          label: 'Possibility ' + path.id,
          summary: path.label,
          detail: 'In this path, you choose ' + path.label + '. The journey unfolds over months and years, shaping who you become.',
          road: path.road,
        };
      }
    });

    const possibilities = await Promise.all(timelinePromises);
    return NextResponse.json({ possibilities });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: 'Failed to generate possibilities' }, { status: 500 });
  }
}
"""
with open('/Users/aayushi/crossroads/app/api/generate/route.ts', 'w') as f:
    f.write(content)
print('done')
