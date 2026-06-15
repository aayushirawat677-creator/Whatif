with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'r') as f:
    content = f.read()

# Add guardrails import at top
if 'guardrails' not in content:
    content = "import { checkGuardrails, getUnderage, getLegalWarning } from '@/lib/guardrails';\n" + content

# Replace existing crisis check with full guardrails check
old = """    // Crisis hard stop
    const decisionLower = (decision || '').toLowerCase();
    if (CRISIS_KEYWORDS.some(kw => decisionLower.includes(kw))) {
      return NextResponse.json({
        phase: 'hard_stop', crisis: true,
        message: "What you are feeling is real and it matters. Please reach out: 988 Suicide & Crisis Lifeline — call or text 988. Crisis Text Line — text HOME to 741741.",
      });
    }"""

new = """    // Full guardrails check
    const guard = checkGuardrails(decision || '');

    if (guard.action === 'hard_stop') {
      return NextResponse.json({
        phase: 'hard_stop',
        crisis: guard.category === 'crisis' || guard.category === 'harm_others',
        category: guard.category,
        message: guard.message,
      });
    }

    if (guard.action === 'age_gate' && guard.popup) {
      return NextResponse.json({
        phase: 'age_gate',
        needs_clarification: true,
        age_gate: true,
        category: guard.category,
        popup: guard.popup,
        question: guard.popup.body,
      });
    }"""

if old in content:
    content = content.replace(old, new)
    print('guardrails replaced in clarify')
else:
    print('pattern not found, adding after imports')
    # Add after the existing imports
    idx = content.find('\nexport async function POST')
    content = content[:idx] + '\n' + new + '\n' + content[idx:]

# Remove old CRISIS_KEYWORDS array if present
content = content.replace("""const CRISIS_KEYWORDS = [
  'kill myself', 'kill my self', 'end my life', 'suicide', 'suicidal',
  'dont want to live', "don't want to live", 'end it all', 'take my life',
  'hurt myself', 'harm myself', 'self harm', 'not worth living',
  'want to die', 'better off dead',
];""", "")

with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'w') as f:
    f.write(content)
print('clarify route updated')
