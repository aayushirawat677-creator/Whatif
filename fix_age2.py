with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

old = """                    setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning('');
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
                    }"""

new = """                    const confirmedAge = ageInput;
                    const confirmedCategory = ageGate.category;
                    setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning('');
                    setIsLoading(true);
                    // Pass age as collected context — NOT as chat message so gatherer won't re-ask
                    const ageCollected = {
                      ...collectedContext,
                      shared: { ...(collectedContext.shared as Record<string,unknown> || {}), user_age: confirmedAge, age_verified: true, category: confirmedCategory }
                    };
                    setCollectedContext(ageCollected);
                    try {
                      const res = await fetch('/api/clarify', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ decision: q, history: chatHistory, phase: 'gather', baseline, collected_context: ageCollected }),
                      });
                      const data = await res.json();
                      if (data.baseline) setBaseline(data.baseline);
                      if (data.collected_context) setCollectedContext(data.collected_context);
                      if (data.needs_clarification && data.question) {
                        setChatHistory(prev => [...prev, { role: 'ai' as const, text: data.question }]);
                        setIsLoading(false);
                      } else {
                        await generate(q, chatHistory, data.baseline || baseline, data.collected_context || ageCollected);
                      }
                    } catch {
                      await generate(q, chatHistory, baseline, ageCollected);
                    }"""

if old in content:
    content = content.replace(old, new)
    print('done')
else:
    print('pattern not found')

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
