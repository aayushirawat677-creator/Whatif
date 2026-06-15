content = """import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://crossroads-resource.services.ai.azure.com/api/projects/crossroads/agents';
const API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY!;

const AGENTS = {
  parser:    'Parser-agent1',
  retriever: 'retriever-agent2',
  timeline:  'Timeline-agent3',
  critic:    'Crtici-agent4',
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
    throw new Error(`Agent ${agentName} error: ${response.status} ${err}`);
  }
  const data = await response.json();
  const outputItem = data.output?.find((item: {type: string}) => item.type === 'message');
  const content = outputItem?.content?.find((c: {type: string}) => c.type === 'output_text');
  return content?.text || '';
}

function safeParseJSON(text: string): Record<string, unknown> {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const { decision, context } = await req.json();
    if (!decision || decision.length < 3) {
      return NextResponse.json({ error: 'Decision too short' }, { status: 400 });
    }

    const fullContext = context || '';

    // Agent 1: Contextualizer
    const parserMsg = `User decision: "${decision}"

Clarifying conversation:
${fullContext || 'No clarifying conversation — decision is as stated above.'}

Analyze this decision and return the structured JSON context.`;

    let parsed: Record<string, unknown> = {};
    try {
      const parsedText = await runAgent(AGENTS.parser, parserMsg);
      parsed = safeParseJSON(parsedText);
      console.log('Parser output:', JSON.stringify(parsed).substring(0, 300));
    } catch (e) {
      console.error('Parser failed:', e);
    }

    // Safety check
    if (parsed.safe === false) {
      return NextResponse.json({
        error: 'This touches on something that needs real support, not possibilities. Please reach out to someone you trust.',
        safe: false,
      }, { status: 400 });
    }

    const domain = (parsed.domain as string) || 'general';
    const timeHorizon = (parsed.time_horizon as string) || 'months_12';
    const emotionalValence = (parsed.emotional_valence as string) || 'grey';
    const contextSummary = (parsed.context_summary as string) || decision;
    const possibilityLabels = (parsed.possibility_labels as Record<string, string>) || {
      first: 'Do it',
      second: "Don't do it",
      third: 'Find a middle way',
    };
    const possibilityTypes = (parsed.possibility_types as string[]) || ['A', 'B', 'C'];

    // Agent 2: Researcher
    let research = '';
    try {
      const researchMsg = `Domain: ${domain}
Time horizon: ${timeHorizon}
User context: ${contextSummary}
Full conversation: ${fullContext || 'None'}

Gather relevant past patterns, future projections, and personal context for this decision.`;
      research = await runAgent(AGENTS.retriever, researchMsg);
      console.log('Research output:', research.substring(0, 200));
    } catch (e) {
      console.error('Retriever failed:', e);
      research = 'No research data available.';
    }

    // Agent 3: Timeline Generator x3 in parallel
    const paths = [
      { id: 1, type: possibilityTypes[0] || 'A', label: possibilityLabels.first || 'Do it', road: 'left' },
      { id: 2, type: possibilityTypes[1] || 'B', label: possibilityLabels.second || "Don't do it", road: 'center' },
      { id: 3, type: possibilityTypes[2] || 'C', label: possibilityLabels.third || 'Middle way', road: 'right' },
    ];

    const timelinePromises = paths.map(async (path) => {
      try {
        const timelineMsg = `User decision: "${decision}"
User context: ${contextSummary}
Emotional valence: ${emotionalValence}
Time horizon: ${timeHorizon}
Possibility type: ${path.type} — ${path.label}

Research data:
${research}

Generate the timeline for this specific possibility: "${path.label}"
Remember: show what COULD happen, never give advice or recommendations.`;

        const text = await runAgent(AGENTS.timeline, timelineMsg);
        const timeline = safeParseJSON(text);

        const detail = [
          timeline.checkpoint_1,
          timeline.checkpoint_2,
          timeline.checkpoint_3,
        ].filter(Boolean).join('\\n\\n') ||
        [timeline.six_months, timeline.two_years, timeline.five_years].filter(Boolean).join('\\n\\n') ||
        `In this path: ${path.label}. The journey unfolds based on your specific situation.`;

        return {
          id: path.id,
          label: `Possibility ${path.id}`,
          summary: (timeline.summary as string) || path.label,
          detail: (detail as string).substring(0, 600),
          road: path.road as 'left' | 'center' | 'right',
        };
      } catch (e) {
        console.error(`Timeline ${path.id} failed:`, e);
        return {
          id: path.id,
          label: `Possibility ${path.id}`,
          summary: path.label,
          detail: `In this path, you choose "${path.label}". The journey unfolds over time, shaped by the context you shared.`,
          road: path.road as 'left' | 'center' | 'right',
        };
      }
    });

    const possibilities = await Promise.all(timelinePromises);

    // Agent 4: Safety & Tone Reviewer
    let critic: Record<string, unknown> = {};
    try {
      const criticMsg = `User decision: "${decision}"
User context: ${contextSummary}
Emotional valence: ${emotionalValence}

Generated possibilities:
${possibilities.map(p => `Possibility ${p.id} (${p.summary}): ${p.detail}`).join('\\n\\n')}

Review these possibilities for advice violations, jailbreak flags, grey area handling, specificity, and tone.`;

      const criticText = await runAgent(AGENTS.critic, criticMsg);
      critic = safeParseJSON(criticText);
    } catch (e) {
      console.error('Critic failed:', e);
    }

    return NextResponse.json({ possibilities, critic });

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json({ error: 'Failed to generate possibilities' }, { status: 500 });
  }
}
"""
with open('/Users/aayushi/crossroads/app/api/generate/route.ts', 'w') as f:
    f.write(content)
print('done')
