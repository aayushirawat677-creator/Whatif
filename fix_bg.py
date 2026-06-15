with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Fix main element to ensure relative positioning and no grid bg
old = """    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Landscape background */}
      <LandscapeBg />"""

new = """    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#F0EBE0' }}>

      {/* Landscape background */}
      <LandscapeBg />"""

content = content.replace(old, new)

# Also check if globals.css has a grid pattern and note it
with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
