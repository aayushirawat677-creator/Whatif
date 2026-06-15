with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

old = """                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: tint.text, opacity: 0.55, fontFamily: 'system-ui,sans-serif', fontStyle: 'italic', lineHeight: 1.4, flex: 1, paddingRight: '12px' }}>
                            {s.cards.length > 1 ? s.cards[1]?.content?.substring(0, 80) + '...' : 'Tap to explore the full timeline'}
                          </p>
                          <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: tint.border, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                            <span style={{ fontSize: '16px', color: tint.text, fontWeight: 700 }}>→</span>
                          </div>
                        </div>"""

new = """                        <div style={{ marginTop: '14px' }}>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', color: tint.text, opacity: 0.52, fontFamily: 'Georgia,serif', fontStyle: 'italic', lineHeight: 1.45 }}>
                            {s.cards.length > 1 ? s.cards[1]?.content?.substring(0, 90) + '...' : 'Tap to explore the full timeline'}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); open(i); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: tint.border, border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                          >
                            <span style={{ fontSize: '13px', color: tint.text, fontFamily: 'system-ui,sans-serif', fontWeight: 600 }}>Read timeline</span>
                            <span style={{ fontSize: '15px', color: tint.text, fontWeight: 700 }}>→</span>
                          </button>
                        </div>"""

content = content.replace(old, new)

# Also add left/right arrow buttons inside the expanded overlay card
old2 = """                          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: tint.text, opacity: 0.28, fontFamily: 'system-ui,sans-serif' }}>swipe · tap dots · arrow keys · esc to close</p>"""

new2 = """                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                            <button onClick={() => swipe(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: tint.border, border: 'none', cursor: 'pointer', fontSize: '18px', color: tint.text, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.8 }}>←</button>
                            <p style={{ margin: 0, fontSize: '11px', color: tint.text, opacity: 0.28, fontFamily: 'system-ui,sans-serif' }}>{activeCard + 1} of {s.cards.length}</p>
                            <button onClick={() => swipe(1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: tint.border, border: 'none', cursor: 'pointer', fontSize: '18px', color: tint.text, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.8 }}>→</button>
                          </div>
                          <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: tint.text, opacity: 0.22, fontFamily: 'system-ui,sans-serif' }}>swipe · arrow keys · esc to close</p>"""

content = content.replace(old2, new2)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
