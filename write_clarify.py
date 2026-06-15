content = """import { NextRequest, NextResponse } from 'next/server';

const ENDPOINT = 'https://crossroads-resource.services.ai.azure.com/openai/v1/responses';
const API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { decision, history } = await req.json();
    const historyText = history.length > 0
      ? '\\n\\nConversation so far:\\n' + history.map((m: {role: string; text: string}) => `${m.role === 'user' ? 'User' : 'Guide'}: ${m.text}`).join('\\n')
      : '';
    const prompt = 'You are a warm guide helping someone think through a life decision. Decision: "' + decision + '"' + historyText + '\\n\\nDo you have enough context to generate three future paths?\\n- If you need ONE more piece of info, ask it as a short warm question\\n- If you have enough context (3+ exchanges OR decision is specific), return ready\\n- Ask MAX 1 question per turn\\n\\nReturn ONLY JSON:\\nIf clarification needed: {"needs_clarification": true, "question": "Your question?"}\\nIf ready: {"needs_clarification": false}';
    const response = await fetch(`${ENDPOINT}?api-version=2025-05-15-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': API_KEY },
      body: JSON.stringify({ model: 'gpt-4.1-mini', max_output_tokens: 200, input: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) return NextResponse.json({ needs_clarification: false });
    const data = await response.json();
    const outputItem = data.output?.find((item: {type: string}) => item.type === 'message');
    const contentItem = outputItem?.content?.find((c: {type: string}) => c.type === 'output_text');
    const text = contentItem?.text || '';
    try {
      const parsed = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ needs_clarification: false });
    }
  } catch {
    return NextResponse.json({ needs_clarification: false });
  }
}
"""
with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'w') as f:
    f.write(content)
print('done')
