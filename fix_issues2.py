with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Remove loading text
content = content.replace(
    "generating your what-ifs...",
    ""
)

# Fix 3: Wider SVG canvas
content = content.replace(
    "  const W = 520; const H = winH;",
    "  const W = 640; const H = winH;"
)

# Bigger sun, more centered
content = content.replace(
    """    <circle cx="120" cy="${sunY}" r="50" fill="${T.sun1}" opacity="0.5"/>
    <circle cx="120" cy="${sunY}" r="33" fill="${T.sun2}" opacity="0.42"/>""",
    """    <circle cx="160" cy="${sunY}" r="62" fill="${T.sun1}" opacity="0.5"/>
    <circle cx="160" cy="${sunY}" r="42" fill="${T.sun2}" opacity="0.42"/>"""
)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('fixes 1 and 3 done')
