import urllib.request
# Check what's actually in page.tsx around the LandscapeBg function
with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

if 'LandscapeBg' in content:
    print('LandscapeBg EXISTS')
    # Find it
    idx = content.find('LandscapeBg')
    print(content[idx:idx+200])
else:
    print('LandscapeBg MISSING - old version still loaded')
    print('First 200 chars:', content[:200])
