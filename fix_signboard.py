with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    lines = f.readlines()
start = None
end = None
for i, l in enumerate(lines):
    if 'Text overlay on the sign board' in l:
        start = i
    if start and i > start and i < start + 30 and l.strip() == '</div>':
        end = i
print('start:', start, 'end:', end)
if start and end:
    new_lines = lines[:start] + lines[end+1:]
    content = ''.join(new_lines)
    content = content.replace("style={{ mixBlendMode: 'multiply' }}", "style={{ width: '160px', height: 'auto' }}", 1)
    with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
        f.write(content)
    print('Done:', len(lines), '->', len(new_lines))
