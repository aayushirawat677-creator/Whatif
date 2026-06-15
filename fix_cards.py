with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

old = """                        <p style={{ margin: 0, fontSize: '12px', color: tint.text, opacity: 0.38, fontFamily: 'system-ui,sans-serif' }}>tap to explore timeline →</p>"""

new = """                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: tint.text, opacity: 0.55, fontFamily: 'system-ui,sans-serif', fontStyle: 'italic', lineHeight: 1.4, flex: 1, paddingRight: '12px' }}>
                            {s.cards.length > 1 ? s.cards[1]?.content?.substring(0, 80) + '...' : 'Tap to explore the full timeline'}
                          </p>
                          <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: tint.border, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                            <span style={{ fontSize: '16px', color: tint.text, fontWeight: 700 }}>→</span>
                          </div>
                        </div>"""

content = content.replace(old, new)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
