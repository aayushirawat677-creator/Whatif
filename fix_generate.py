with open('/Users/aayushi/crossroads/app/api/generate/route.ts', 'r') as f:
    content = f.read()
content = content.replace(
    'const { decision } = await req.json();',
    'const { decision, context } = await req.json();\n    const fullDecision = context ? decision + "\\nContext: " + context : decision;'
)
content = content.replace(
    'const parsedText = await runAgent(AGENTS.parser, decision);',
    'const parsedText = await runAgent(AGENTS.parser, fullDecision);'
)
with open('/Users/aayushi/crossroads/app/api/generate/route.ts', 'w') as f:
    f.write(content)
print('done')
