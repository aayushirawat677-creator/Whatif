with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

old = """                          <p style={{ margin: '0 0 16px', fontSize: '12px', color: tint.text, opacity: 0.45, fontFamily: 'system-ui,sans-serif' }}>{card.title} · {activeCard + 1} of {s.cards.length}</p>
                          <p style={{ margin: 0, fontSize: activeCard === 0 ? '22px' : '16px', fontWeight: activeCard === 0 ? 700 : 400, color: tint.text, fontFamily: 'Georgia,serif', lineHeight: activeCard === 0 ? 1.25 : 1.7 }}>{card.content}</p>"""

new = """                          <p style={{ margin: '0 0 16px', fontSize: '12px', color: tint.text, opacity: 0.45, fontFamily: 'system-ui,sans-serif' }}>{card.title} · {activeCard + 1} of {s.cards.length}</p>
                          {activeCard === 0 ? (
                            <div>
                              <p style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 700, color: tint.text, fontFamily: 'Georgia,serif', lineHeight: 1.25 }}>{s.label}</p>
                              <p style={{ margin: 0, fontSize: '15px', color: tint.text, fontFamily: 'Georgia,serif', lineHeight: 1.65, opacity: 0.88 }}>{card.content}</p>
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '16px', color: tint.text, fontFamily: 'Georgia,serif', lineHeight: 1.7 }}>{card.content}</p>
                          )}"""

if old in content:
    content = content.replace(old, new)
    print('card fix applied')
else:
    print('pattern not found — searching...')
    idx = content.find('activeCard === 0 ?')
    print(content[max(0,idx-200):idx+200])

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
