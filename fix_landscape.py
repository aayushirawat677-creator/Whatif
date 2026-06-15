with open('/Users/aayushi/crossroads/app/page.tsx', 'r') as f:
    content = f.read()

old = """  const W = 390; const H = winH;
  const sunY = H * 0.2; const h1Y = H * 0.65; const h2Y = H * 0.72; const h3Y = H * 0.80; const h4Y = H * 0.87;

  const landscape = `
    <rect width="${W}" height="${H}" fill="${T.sky}"/>
    <circle cx="110" cy="${sunY}" r="48" fill="${T.sun1}" opacity="0.55"/>
    <circle cx="110" cy="${sunY}" r="32" fill="${T.sun2}" opacity="0.45"/>
    <path d="M-10 ${h1Y} Q90 ${h1Y-90} 180 ${h1Y-50} Q260 ${h1Y-88} 340 ${h1Y-60} Q370 ${h1Y-72} ${W+10} ${h1Y-55} L${W+10} ${H} L-10 ${H} Z" fill="${T.hill1}" opacity="0.52"/>
    <path d="M-10 ${h2Y} Q70 ${h2Y-80} 155 ${h2Y-42} Q215 ${h2Y-78} 285 ${h2Y-52} Q340 ${h2Y-68} ${W+10} ${h2Y-46} L${W+10} ${H} L-10 ${H} Z" fill="${T.hill2}" opacity="0.6"/>
    <path d="M-10 ${h3Y} Q75 ${h3Y-72} 158 ${h3Y-40} Q228 ${h3Y-68} 308 ${h3Y-44} Q358 ${h3Y-58} ${W+10} ${h3Y-36} L${W+10} ${H} L-10 ${H} Z" fill="${T.hill3}" opacity="0.7"/>
    <path d="M-10 ${h4Y} Q108 ${h4Y-34} 208 ${h4Y-20} Q308 ${h4Y-32} ${W+10} ${h4Y-14} L${W+10} ${H} L-10 ${H} Z" fill="${T.hill4}" opacity="0.82"/>
  `;"""

new = """  const W = 520; const H = winH;
  const sunY = H * 0.18;
  const h1Y = H * 0.60; const h2Y = H * 0.68; const h3Y = H * 0.77; const h4Y = H * 0.86;

  const landscape = `
    <rect width="${W}" height="${H}" fill="${T.sky}"/>
    <circle cx="120" cy="${sunY}" r="50" fill="${T.sun1}" opacity="0.5"/>
    <circle cx="120" cy="${sunY}" r="33" fill="${T.sun2}" opacity="0.42"/>
    <path d="M-60 ${h1Y} Q60 ${h1Y-110} 180 ${h1Y-60} Q300 ${h1Y-105} 420 ${h1Y-70} Q470 ${h1Y-85} ${W+60} ${h1Y-65} L${W+60} ${H} L-60 ${H} Z" fill="${T.hill1}" opacity="0.55"/>
    <path d="M-60 ${h2Y} Q50 ${h2Y-95} 170 ${h2Y-50} Q290 ${h2Y-90} 400 ${h2Y-60} Q460 ${h2Y-78} ${W+60} ${h2Y-55} L${W+60} ${H} L-60 ${H} Z" fill="${T.hill2}" opacity="0.62"/>
    <path d="M-60 ${h3Y} Q55 ${h3Y-85} 175 ${h3Y-48} Q295 ${h3Y-80} 410 ${h3Y-52} Q465 ${h3Y-68} ${W+60} ${h3Y-42} L${W+60} ${H} L-60 ${H} Z" fill="${T.hill3}" opacity="0.72"/>
    <path d="M-60 ${h4Y} Q130 ${h4Y-42} 260 ${h4Y-25} Q390 ${h4Y-40} ${W+60} ${h4Y-18} L${W+60} ${H} L-60 ${H} Z" fill="${T.hill4}" opacity="0.85"/>
  `;"""

content = content.replace(old, new)

with open('/Users/aayushi/crossroads/app/page.tsx', 'w') as f:
    f.write(content)
print('done')
