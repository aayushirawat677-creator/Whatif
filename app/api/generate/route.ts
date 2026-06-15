import { NextRequest, NextResponse } from 'next/server';

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
        detail = [impacts.short_term, impacts.medium_term, impacts.long_term].filter(Boolean).join('\n\n');
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
