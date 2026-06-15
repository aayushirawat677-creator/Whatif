with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Fix: after age confirmed, go back to clarify flow not generate
old = """                  <button onClick={() => {
                    const q = originalQuestion || chatHistory[0]?.text || '';
                    setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning('');
                    generate(q, chatHistory, baseline, collectedContext);
                  }}"""

new = """                  <button onClick={async () => {
                    const q = originalQuestion || chatHistory[0]?.text || '';
                    setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning('');
                    // Go back to normal clarify flow with age context added
                    setIsLoading(true);
                    const ageContext = 'User age confirmed: ' + ageInput + ' years old.';
                    const newHist: ChatMessage[] = [...chatHistory, { role: 'user' as const, text: ageContext }];
                    setChatHistory(newHist);
                    try {
                      const res = await fetch('/api/clarify', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ decision: q, history: newHist, phase: 'gather', baseline, collected_context: collectedContext }),
                      });
                      const data = await res.json();
                      if (data.baseline) setBaseline(data.baseline);
                      if (data.collected_context) setCollectedContext(data.collected_context);
                      if (data.needs_clarification && data.question) {
                        setChatHistory([...newHist, { role: 'ai', text: data.question }]);
                        setIsLoading(false);
                      } else {
                        await generate(q, newHist, data.baseline || baseline, data.collected_context || collectedContext);
                      }
                    } catch {
                      await generate(q, newHist, baseline, collectedContext);
                    }
                  }}"""

if old in content:
    content = content.replace(old, new)
    print('done')
else:
    print('pattern not found')
    idx = content.find('I understand — show me the possibilities')
    print(content[max(0,idx-300):idx+50])

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
