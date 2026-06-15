content = """import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://crossroads-resource.services.ai.azure.com/api/projects/crossroads/agents';
const API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY!;

const AGENTS = {
  classifier: 'Parser-agent1',
  gatherer:   'retriever-agent2',
};

async function runAgent(agentName: string, message: string): Promise<string> {
  const endpoint = BASE + '/' + agentName + '/endpoint/protocols/openai/responses?api-version=2025-05-15-preview';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      max_output_tokens: 2000,
      input: [{ role: 'user', content: message }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    console.error('AGENT ERROR', agentName, response.status, err);
    throw new Error('Agent ' + agentName + ' error: ' + response.status);
  }
  const data = await response.json();
  const outputItem = data.output?.find((item: {type: string}) => item.type === 'message');
  const contentItem = outputItem?.content?.find((c: {type: string}) => c.type === 'output_text');
  return contentItem?.text || '';
}

function safeParseJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}

const CRISIS_KEYWORDS = [
  'kill myself', 'kill my self', 'end my life', 'suicide', 'suicidal',
  'dont want to live', "don't want to live", 'end it all', 'take my life',
  'hurt myself', 'harm myself', 'self harm', 'not worth living',
  'want to die', 'better off dead',
];

export async function POST(req: NextRequest) {
  try {
    const { decision, history, phase, baseline, collected_context } = await req.json();

    // Crisis hard stop
    const decisionLower = (decision || '').toLowerCase();
    if (CRISIS_KEYWORDS.some(kw => decisionLower.includes(kw))) {
      return NextResponse.json({
        phase: 'hard_stop', crisis: true,
        message: "What you are feeling is real and it matters. Please reach out: 988 Suicide & Crisis Lifeline — call or text 988. Crisis Text Line — text HOME to 741741.",
      });
    }

    // Build full conversation string for agents
    const conversationText = (history || [])
      .map((m: {role: string; text: string}) => (m.role === 'user' ? 'User' : 'Guide') + ': ' + m.text)
      .join('\\n');

    // Phase: classify (first message)
    if (!phase || phase === 'classify') {
      const msg = 'User input: "' + decision + '"\\n\\nClassify this input and return the structured JSON.';
      const text = await runAgent(AGENTS.classifier, msg);
      const data = safeParseJSON(text);
      console.log('Classifier:', JSON.stringify(data).substring(0, 300));

      if (data.safe === false) {
        const flag = data.safety_flag;
        if (flag === 'self_harm') {
          return NextResponse.json({ phase: 'hard_stop', crisis: true, message: 'Please reach out: 988 Suicide & Crisis Lifeline (call or text 988).' });
        }
        if (flag === 'harmful_drug') {
          return NextResponse.json({ phase: 'hard_stop', message: 'This involves serious health risk. SAMHSA helpline: 1-800-662-4357.' });
        }
      }

      // If needs gate answer, ask the baseline question directly
      if (data.needs_gate_answer && data.baseline_question) {
        return NextResponse.json({
          phase: 'gate',
          needs_clarification: true,
          question: data.baseline_question,
          baseline: data,
          collected_context: {},
        });
      }

      // Option compare or no gate needed — run gatherer immediately
      const gathererMsg = 'Baseline: ' + JSON.stringify(data) + '\\n\\nConversation so far:\\n' + conversationText + '\\n\\nCollected context: {}\\n\\nWhat is the first context question to ask?';
      const gathererText = await runAgent(AGENTS.gatherer, gathererMsg);
      const gathererData = safeParseJSON(gathererText);
      console.log('Gatherer:', JSON.stringify(gathererData).substring(0, 200));

      if (gathererData.ready_to_generate) {
        return NextResponse.json({ phase: 'ready', needs_clarification: false, baseline: data, collected_context: gathererData.collected_context || {} });
      }

      const nextQ = gathererData.next_question as Record<string, unknown> | undefined;
      return NextResponse.json({
        phase: 'gather',
        needs_clarification: true,
        question: nextQ?.question || 'Tell me a bit more about your situation.',
        baseline: data,
        collected_context: gathererData.collected_context || {},
      });
    }

    // Phase: gate or gather — run gatherer with full context
    const gathererMsg = 'Baseline from classifier:\\n' + JSON.stringify(baseline || {}) +
      '\\n\\nFull conversation so far:\\n' + conversationText +
      '\\n\\nCollected context so far:\\n' + JSON.stringify(collected_context || {}) +
      '\\n\\nBased on the conversation, determine what context is still missing. Ask ONE question or mark ready_to_generate if enough context exists.';

    const gathererText = await runAgent(AGENTS.gatherer, gathererMsg);
    const gathererData = safeParseJSON(gathererText);
    console.log('Gatherer:', JSON.stringify(gathererData).substring(0, 300));

    if (gathererData.ready_to_generate) {
      return NextResponse.json({
        phase: 'ready',
        needs_clarification: false,
        baseline: baseline,
        collected_context: gathererData.collected_context || collected_context,
      });
    }

    const nextQ = gathererData.next_question as Record<string, unknown> | undefined;
    return NextResponse.json({
      phase: 'gather',
      needs_clarification: true,
      question: nextQ?.question || 'Can you tell me more?',
      baseline: baseline,
      collected_context: gathererData.collected_context || collected_context,
    });

  } catch (error) {
    console.error('Clarify error:', error);
    return NextResponse.json({ needs_clarification: false, phase: 'ready' });
  }
}
"""
with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'w') as f:
    f.write(content)
print('done')
