with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Cancel on age gate goes back to chat with question still there
# instead of resetting completely
old1 = """                  <button onClick={() => { setAgeGate(null); setAgeInput(''); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '4px' }}>
                    cancel
                  </button>"""

new1 = """                  <button onClick={() => { setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '4px' }}>
                    go back
                  </button>"""
content = content.replace(old1, new1)

# Fix 1: Second cancel button (after age confirmed)
old2 = """                  <button onClick={() => { setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '10px' }}>
                    cancel
                  </button>"""

new2 = """                  <button onClick={() => { setAgeGate(null); setAgeInput(''); setAgeConfirmed(false); setLegalWarning(''); }} style={{ background: 'none', border: 'none', color: T.textLight, fontFamily: 'system-ui,sans-serif', fontSize: '12px', cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '10px' }}>
                    go back
                  </button>"""
content = content.replace(old2, new2)

# Fix 2: Clear scenarios when update/edit is submitted so old results dont show
old3 = """  const handleEdit = async () => {
    if (editInput.length < 2 || isLoading) return;
    const nc: ChatMessage[] = [...chatHistory, { role: 'user', text: editInput }];
    setChatHistory(nc); setEditInput(''); await generate(originalQuestion, nc, baseline, collectedContext);
  };"""

new3 = """  const handleEdit = async () => {
    if (editInput.length < 2 || isLoading) return;
    const nc: ChatMessage[] = [...chatHistory, { role: 'user', text: editInput }];
    setChatHistory(nc); setEditInput('');
    setScenarios([]); // Clear old results before new ones load
    await generate(originalQuestion, nc, baseline, collectedContext);
  };"""
content = content.replace(old3, new3)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
