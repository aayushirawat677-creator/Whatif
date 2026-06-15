with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Replace the SVG component with inline background on main
old = """function LandscapeBg() {
  return (
    <svg
      viewBox="0 0 390 844"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="390" height="844" fill="#F0EBE0" />
      <circle cx="130" cy="180" r="52" fill="#E8B4A0" opacity="0.5" />
      <circle cx="130" cy="180" r="36" fill="#E09888" opacity="0.4" />
      <path d="M-10 570 Q80 480 170 520 Q240 478 320 512 Q360 492 400 508 L400 844 L-10 844 Z" fill="#C8C8A0" opacity="0.5" />
      <path d="M-10 625 Q65 538 148 578 Q210 538 278 568 Q338 544 400 562 L400 844 L-10 844 Z" fill="#A8A870" opacity="0.58" />
      <path d="M-10 695 Q72 615 155 648 Q225 612 305 644 Q355 622 400 638 L400 844 L-10 844 Z" fill="#8C7D5A" opacity="0.68" />
      <path d="M-10 758 Q105 728 205 742 Q305 726 400 748 L400 844 L-10 844 Z" fill="#6B5A3A" opacity="0.78" />
    </svg>
  );
}"""

new = """function LandscapeBg() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 390 844"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="390" height="844" fill="#F0EBE0" />
        <circle cx="130" cy="180" r="52" fill="#E8B4A0" opacity="0.5" />
        <circle cx="130" cy="180" r="36" fill="#E09888" opacity="0.4" />
        <path d="M-10 570 Q80 480 170 520 Q240 478 320 512 Q360 492 400 508 L400 844 L-10 844 Z" fill="#C8C8A0" opacity="0.5" />
        <path d="M-10 625 Q65 538 148 578 Q210 538 278 568 Q338 544 400 562 L400 844 L-10 844 Z" fill="#A8A870" opacity="0.58" />
        <path d="M-10 695 Q72 615 155 648 Q225 612 305 644 Q355 622 400 638 L400 844 L-10 844 Z" fill="#8C7D5A" opacity="0.68" />
        <path d="M-10 758 Q105 728 205 742 Q305 726 400 748 L400 844 L-10 844 Z" fill="#6B5A3A" opacity="0.78" />
      </svg>
    </div>
  );
}"""

content = content.replace(old, new)

# Make sure main has position relative
old2 = """    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#F0EBE0' }}>"""
new2 = """    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#F0EBE0', isolation: 'isolate' }}>"""
content = content.replace(old2, new2)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
