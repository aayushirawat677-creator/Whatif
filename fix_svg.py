with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

old = """      {/* Subtle paper texture overlay */}
      <rect width="390" height="844" fill="url(#paper)" opacity="0.06" />
      <defs>
        <pattern id="paper" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#8C7060" />
        </pattern>
      </defs>"""

new = """"""

content = content.replace(old, new)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
