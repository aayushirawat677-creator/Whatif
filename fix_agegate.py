with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Add age gate state
old = "  const [collectedContext, setCollectedContext] = useState<Record<string, unknown>>({});"
new = """  const [collectedContext, setCollectedContext] = useState<Record<string, unknown>>({});
  const [ageGate, setAgeGate] = useState<{popup: {title: string; body: string; acknowledge: string}; category: string} | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ageInput, setAgeInput] = useState('');
  const [legalWarning, setLegalWarning] = useState('');"""
content = content.replace(old, new)

# Handle age_gate response in handleSubmit
old2 = """      if (data.crisis || data.phase === 'hard_stop') { setChatHistory([...hist, { role: 'ai', text: data.message || 'Please seek support.' }]); setIsLoading(false); return; }"""
new2 = """      if (data.crisis || data.phase === 'hard_stop') { setChatHistory([...hist, { role: 'ai', text: data.message || 'Please seek support.' }]); setIsLoading(false); return; }
      if (data.phase === 'age_gate' && data.popup) { setAgeGate({ popup: data.popup, category: data.category }); setIsLoading(false); return; }"""
content = content.replace(old2, new2)

# Add age gate UI before closing </main>
old3 = "      {/* LOADING WITH QUOTES */}"
new3 = """      {/* AGE GATE POPUP */}
      <AnimatePresence>
        {ageGate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(44,38,28,0.65)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 20 }}
              style={{ background: 'rgba(253,252,248,0.98)', borderRadius: '26px', padding: '32px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: T.olive, fontFamily: 'system-ui,sans-serif', fontWeight: 700 }}>
                {ageGate.popup.title}
              </p>
              <p style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: T.text, fontFamily: 'Georgia,serif', lineHeight: 1.3 }}>
                {ageGate.popup.body}
              </p>
              {!ageConfirmed ? (
                <div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input
                      value={ageInput}
                      onChange={e => setAgeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="Your age"
                      style={{ flex: 1, borderRadius: '20px', outline: 'none', background: '#FAF8F5', border: '1.5px solid ' + T.oliveMid, color: T.text, fontFamily: 'system-ui,sans-serif', fontSize: '16px', padding: '11px 18px' }}
                    />
                    <button onClick={() => {
                      const age = parseInt(ageInput);
                      const legalAge = ageGate.category === 'alcohol' ? 21 : 18;
                      if (age < legalAge) {
                        const msg = ageGate.category === 'alcohol'
                          ? "🧃 You're not quite of legal drinking age yet! The good news? Sparkling water with lime hits different — and your liver will thank you later. Come back when you're legal, and until then, let's raise a glass of OJ! 🍊"
                          : "🌿 You're too young for this one! Your body is still developing and deserves better. Find something that actually feels good — sports, music, art. Your future self will be grateful. 💪";
                        setChatHistory(prev => [...prev, { role: 'ai', text: msg }]);
                        setAgeGate(null); setAgeInput(''); setAgeConfirmed(false);
                      } else {
                        setAgeConfirmed(true);
                        const warning = ageGate.category === 'alcohol'
                          ? "⚠️ What If will explore both paths honestly — including the not-so-glamorous parts. This is not encouragement to drink."
                          : "⚠️ Smoking carries significant health risks. What If will show possibilities honestly, including long-term impacts. This is not encouragement.";
                        setLegalWarning(warning);
                      }
                    }}
                      disabled={ageInput.length < 1}
                      style={{ borderRadius: '20px', padding: '11px 20px', background: ageInput.length >= 1 ? T.olive : T.oliveMid, color: T.white, border: 'none', cursor: ageInput.length >= 1 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '15px', fontFamily: 'system-ui,sans-serif' }}>
                      Confirm
                    </button>
                  </div>
                  <button onClick={() => { setAgeGate(null); setAgeInput(''); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '4px' }}>
                    cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#8C4A28', fontFamily: 'Georgia,serif', lineHeight: 1.55, fontStyle: 'italic', background: '#FFF0E0', borderRadius: '12px', padding: '12px 16px' }}>
                    {ageGate.popup.acknowledge}
                  </p>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: T.textMid, fontFamily: 'Georgia,serif', lineHeight: 1.55 }}>
                    {legalWarning}
                  </p>
                  <button onClick={() => {
                    const q = originalQuestion || chatHistory[0]?.text || '';
                    setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning('');
                    generate(q, chatHistory, baseline, collectedContext);
                  }}
                    style={{ width: '100%', borderRadius: '22px', padding: '13px', background: T.olive, color: T.white, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: 'system-ui,sans-serif' }}>
                    I understand — show me the possibilities
                  </button>
                  <button onClick={() => { setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '10px' }}>
                    cancel
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING WITH QUOTES */}"""

content = content.replace(old3, new3)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
