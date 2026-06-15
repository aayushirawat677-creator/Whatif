import os

# ============================================
# /api/clarify/route.ts — handles classify + gather phases
# ============================================
clarify = """import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://crossroads-resource.services.ai.azure.com/api/projects/crossroads/agents';
const ENDPOINT_DIRECT = 'https://crossroads-resource.services.ai.azure.com/openai/v1/responses';
const API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY!;

const AGENTS = {
  classifier: 'Parser-agent1',
  gatherer:   'retriever-agent2',
};

async function runAgent(agentName: string, message: string): Promise<string> {
  const endpoint = `${BASE}/${agentName}/endpoint/protocols/openai/responses?api-version=2025-05-15-preview`;
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
    console.error('Agent error:', agentName, err);
    throw new Error('Agent ' + agentName + ' error: ' + response.status);
  }
  const data = await response.json();
  const outputItem = data.output?.find((item: {type: string}) => item.type === 'message');
  const content = outputItem?.content?.find((c: {type: string}) => c.type === 'output_text');
  return content?.text || '';
}

function safeParseJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}

// Crisis keywords — hard stop before any agent
const CRISIS_KEYWORDS = [
  'kill myself', 'kill my self', 'end my life', 'suicide', 'suicidal',
  'dont want to live', "don't want to live", 'end it all', 'take my life',
  'hurt myself', 'harm myself', 'self harm', 'not worth living',
  'want to die', 'better off dead'
];

export async function POST(req: NextRequest) {
  try {
    const { decision, history, phase, baseline, collected_context, gate_answer } = await req.json();

    // Crisis check
    const decisionLower = decision.toLowerCase();
    if (CRISIS_KEYWORDS.some(kw => decisionLower.includes(kw))) {
      return NextResponse.json({
        phase: 'hard_stop',
        crisis: true,
        message: "What you're feeling is real and it matters. Please reach out: 988 Suicide & Crisis Lifeline (call or text 988), Crisis Text Line (text HOME to 741741)."
      });
    }

    // Phase 1: Classify (first call)
    if (!phase || phase === 'classify') {
      const classifierMsg = 'User input: "' + decision + '"\\n\\nClassify this input and return the JSON.';
      const classifierText = await runAgent(AGENTS.classifier, classifierMsg);
      const classifierData = safeParseJSON(classifierText);
      console.log('Classifier:', JSON.stringify(classifierData).substring(0, 300));

      // Safety hard stop
      if (classifierData.safe === false) {
        const flag = classifierData.safety_flag;
        if (flag === 'self_harm') {
          return NextResponse.json({
            phase: 'hard_stop',
            crisis: true,
            message: "Please reach out: 988 Suicide & Crisis Lifeline (call or text 988)."
          });
        }
        if (flag === 'harmful_drug') {
          return NextResponse.json({
            phase: 'hard_stop',
            message: "This involves serious health risk. SAMHSA helpline: 1-800-662-4357."
          });
        }
        if (flag === 'medical') {
          return NextResponse.json({
            phase: 'hard_stop',
            message: "This decision needs a medical professional who knows your full history."
          });
        }
      }

      // Needs gate answer?
      if (classifierData.needs_gate_answer && classifierData.baseline_question) {
        return NextResponse.json({
          phase: 'gate',
          needs_clarification: true,
          question: classifierData.baseline_question,
          baseline: classifierData,
        });
      }

      // Option compare or no gate needed — go to gather
      return NextResponse.json({
        phase: 'gather',
        baseline: classifierData,
        collected_context: {},
        needs_clarification: true,
        question: null, // Agent 2 will ask first question
      });
    }

    // Phase 2: Gather context
    if (phase === 'gather' || phase === 'gate') {
      const historyText = (history || [])
        .map((m: {role: string; text: string}) => (m.role === 'user' ? 'User' : 'Guide') + ': ' + m.text)
        .join('\\n');

      const gathererMsg = `Baseline from classifier:
${JSON.stringify(baseline)}

Gate answer: ${gate_answer || 'N/A'}

Conversation history:
${historyText || 'None yet'}

Collected context so far:
${JSON.stringify(collected_context || {})}

Determine what context is still needed. Ask ONE question or mark ready_to_generate.`;

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
        question: nextQ?.question || 'Tell me more about your situation.',
        baseline: baseline,
        collected_context: gathererData.collected_context || collected_context,
      });
    }

    return NextResponse.json({ needs_clarification: false, phase: 'ready' });

  } catch (error) {
    console.error('Clarify error:', error);
    return NextResponse.json({ needs_clarification: false, phase: 'ready' });
  }
}
"""

# ============================================
# /api/generate/route.ts — calls What-If Generator
# ============================================
generate = """import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://crossroads-resource.services.ai.azure.com/api/projects/crossroads/agents';
const API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY!;

const AGENTS = {
  generator: 'Timeline-agent3',
  judge:     'Crtici-agent4',
};

async function runAgent(agentName: string, message: string): Promise<string> {
  const endpoint = `${BASE}/${agentName}/endpoint/protocols/openai/responses?api-version=2025-05-15-preview`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      max_output_tokens: 3000,
      input: [{ role: 'user', content: message }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    console.error('Agent error:', agentName, err);
    throw new Error('Agent ' + agentName + ' error: ' + response.status);
  }
  const data = await response.json();
  const outputItem = data.output?.find((item: {type: string}) => item.type === 'message');
  const content = outputItem?.content?.find((c: {type: string}) => c.type === 'output_text');
  return content?.text || '';
}

function safeParseJSON(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const { decision, context, baseline, collected_context } = await req.json();

    // Generate what-ifs
    const generatorMsg = `Baseline from classifier:
${JSON.stringify(baseline || {})}

Collected context:
${JSON.stringify(collected_context || {})}

User's original question: "${decision}"
Additional conversation context: ${context || 'None'}

Generate what-if scenarios for BOTH paths. Follow the output structure based on query_mode and time_impact from the baseline.`;

    let scenarios: Record<string, unknown> = {};
    try {
      const genText = await runAgent(AGENTS.generator, generatorMsg);
      scenarios = safeParseJSON(genText);
      console.log('Generator output:', JSON.stringify(scenarios).substring(0, 400));
    } catch (e) {
      console.error('Generator failed:', e);
    }

    // Convert scenarios to possibilities format for current UI
    const scenarioList = (scenarios.scenarios as Array<Record<string, unknown>>) || [];
    const timeImpact = (scenarios.time_impact as string) || (baseline as Record<string, unknown>)?.time_impact || 'long';
    const contextNote = (scenarios.context_note as string) || '';

    const possibilities = scenarioList.map((s: Record<string, unknown>, i: number) => {
      const impacts = s.impacts as Record<string, string> | undefined;
      let detail = '';
      if (timeImpact === 'long' && impacts) {
        detail = [impacts.short_term, impacts.medium_term, impacts.long_term].filter(Boolean).join('\\n\\n');
      } else {
        detail = (s.what_if as string) || '';
      }

      const roads = ['left', 'center', 'right'];
      return {
        id: i + 1,
        label: (s.label as string) || 'Possibility ' + (i + 1),
        summary: (s.label as string) || 'Path ' + (i + 1),
        detail: detail || 'This path unfolds based on your specific situation.',
        road: roads[i] || 'center',
        polarity: s.polarity || null,
      };
    });

    // If no scenarios generated, use fallback
    if (possibilities.length === 0) {
      const paths = (baseline as Record<string, unknown>)?.paths as Record<string, Record<string, string>> | undefined;
      if (paths) {
        const labels = paths.yes
          ? [paths.yes?.label || 'Yes', paths.no?.label || 'No']
          : [paths.option_a?.label || 'Option A', paths.option_b?.label || 'Option B'];

        labels.forEach((label, i) => {
          possibilities.push({
            id: i + 1,
            label: label,
            summary: label,
            detail: 'In this path, you choose "' + label + '". The journey unfolds based on your context.',
            road: i === 0 ? 'left' : 'right',
            polarity: null,
          });
        });
      }
    }

    return NextResponse.json({
      possibilities,
      context_note: contextNote,
    });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: 'Failed to generate possibilities' }, { status: 500 });
  }
}
"""

# Write both files
os.makedirs('/Users/aayushi/crossroads/app/api/clarify', exist_ok=True)
os.makedirs('/Users/aayushi/crossroads/app/api/generate', exist_ok=True)

with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'w') as f:
    f.write(clarify)
print('clarify route written')

with open('/Users/aayushi/crossroads/app/api/generate/route.ts', 'w') as f:
    f.write(generate)
print('generate route written')
