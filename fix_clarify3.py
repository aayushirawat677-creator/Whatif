with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'r') as f:
    content = f.read()

# Skip classifier on gather phase - use cached baseline
old = """    // Force ready after 2 questions
    const questionCount = (history || []).filter((m: {role: string}) => m.role === 'ai').length;
    if (questionCount >= 2) {
      return NextResponse.json({ phase: 'ready', needs_clarification: false, baseline, collected_context });
    }

    // Phase: gate or gather — run gatherer with full context
    const gathererMsg"""

new = """    // Force ready after 3 questions max
    const questionCount = (history || []).filter((m: {role: string}) => m.role === 'ai').length;
    if (questionCount >= 3) {
      return NextResponse.json({ phase: 'ready', needs_clarification: false, baseline, collected_context });
    }

    // Phase: gate or gather — use cached baseline, only run gatherer
    const gathererMsg"""

content = content.replace(old, new)

with open('/Users/aayushi/crossroads/app/api/clarify/route.ts', 'w') as f:
    f.write(content)
print('clarify done')
