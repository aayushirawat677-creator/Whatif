with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

# Find and replace the landscape section
import re

old = re.search(r'  const W = \d+; const H = winH;.*?`;\n\n  const bgStyle', content, re.DOTALL).group(0)

new = """  const W = 1400; const H = winH;
  const sunY = H * 0.16;
  const h1Y = H * 0.72; const h2Y = H * 0.78; const h3Y = H * 0.84; const h4Y = H * 0.90;

  const landscape = `
    <rect width="${W}" height="${H}" fill="${T.sky}"/>
    <circle cx="160" cy="${sunY}" r="62" fill="${T.sun1}" opacity="0.5"/>
    <circle cx="160" cy="${sunY}" r="42" fill="${T.sun2}" opacity="0.42"/>
    <path d="M0 ${h1Y} Q175 ${h1Y-80} 350 ${h1Y-45} Q525 ${h1Y-80} 700 ${h1Y-50} Q875 ${h1Y-78} 1050 ${h1Y-48} Q1225 ${h1Y-75} ${W} ${h1Y-52} L${W} ${H} L0 ${H} Z" fill="${T.hill1}" opacity="0.55"/>
    <path d="M0 ${h2Y} Q175 ${h2Y-72} 350 ${h2Y-40} Q525 ${h2Y-70} 700 ${h2Y-42} Q875 ${h2Y-68} 1050 ${h2Y-38} Q1225 ${h2Y-65} ${W} ${h2Y-40} L${W} ${H} L0 ${H} Z" fill="${T.hill2}" opacity="0.62"/>
    <path d="M0 ${h3Y} Q175 ${h3Y-62} 350 ${h3Y-34} Q525 ${h3Y-60} 700 ${h3Y-36} Q875 ${h3Y-58} 1050 ${h3Y-32} Q1225 ${h3Y-55} ${W} ${h3Y-34} L${W} ${H} L0 ${H} Z" fill="${T.hill3}" opacity="0.72"/>
    <path d="M0 ${h4Y} Q350 ${h4Y-28} 700 ${h4Y-16} Q1050 ${h4Y-26} ${W} ${h4Y-14} L${W} ${H} L0 ${H} Z" fill="${T.hill4}" opacity="0.85"/>
  `;

  const bgStyle = """

content = content[:content.find('  const W = ')] + new + content[content.find('  const bgStyle') + len('  const bgStyle'):]

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
