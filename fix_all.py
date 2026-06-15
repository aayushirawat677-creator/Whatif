# Fix 1 + 3: page.tsx fixes
with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: auto-submit on pill click
old = """                        <button key={ex} onClick={() => { setInputValue(ex); setTimeout(() => inputRef.current?.focus(), 50); }}"""
new = """                        <button key={ex} onClick={async () => { setOriginalQuestion(ex); setInputValue(''); setIsLoading(true); const hist = [{ role: 'user' as const, text: ex }]; setChatHistory(hist); try { const res = await fetch('/api/clarify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: ex, history: hist, phase: 'classify', baseline: null, collected_context: {} }) }); const data = await res.json(); if (data.baseline) setBaseline(data.baseline); if (data.collected_context) setCollectedContext(data.collected_context); if (data.needs_clarification && data.question) { setChatHistory([...hist, { role: 'ai', text: data.question }]); setIsLoading(false); } else { await generate(ex, hist, data.baseline, data.collected_context || {}); } } catch { await generate(ex, hist, null, {}); } }}"""
content = content.replace(old, new)

# Fix 3: keep transitioning phase until results arrive (don't switch to results early)
old2 = """    setTimeout(() => setPhase('results'), rm ? 0 : 500);"""
new2 = """    // Phase stays 'transitioning' until results arrive — quotes show the whole time"""
content = content.replace(old2, new2)

# Fix 3: set results phase AFTER data arrives
old3 = """      const built = buildScenarios(data.possibilities || []);
      setScenarios(built.length > 0 ? built : [{ id: 1, label: 'Option A', polarity: null, summary: 'Loading...', cards: [{ title: 'Overview', content: 'Generating...' }] }]);
    } catch { setScenarios([{ id: 1, label: 'Error', polarity: null, summary: 'Try again', cards: [{ title: 'Overview', content: 'Could not generate. Please try again.' }] }]); }
    finally { setIsLoading(false); }"""
new3 = """      const built = buildScenarios(data.possibilities || []);
      setScenarios(built.length > 0 ? built : [{ id: 1, label: 'Option A', polarity: null, summary: 'Loading...', cards: [{ title: 'Overview', content: 'Generating...' }] }]);
      setPhase('results');
    } catch { setScenarios([{ id: 1, label: 'Error', polarity: null, summary: 'Try again', cards: [{ title: 'Overview', content: 'Could not generate. Please try again.' }] }]); setPhase('results'); }
    finally { setIsLoading(false); }"""
content = content.replace(old3, new3)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('page.tsx done')
