const fs = require('fs');
const path = 'como-aumentar-margem-industrial-escassez-mao-de-obra/index.html';
let h = fs.readFileSync(path, 'utf8');

// 1. Find and remove post navigation
const navStart = h.indexOf('<nav class="navigation post-navigation"');
const navEnd = h.indexOf('</nav>', navStart);
h = h.slice(0, navStart) + h.slice(navEnd + 6);
console.log('1. Post navigation removed');

// 2. Find and remove related posts
const relLabel = h.indexOf('Posts relacionados');
const relSectionStart = h.lastIndexOf('<div', relLabel);
let depth = 1, i = relSectionStart + 4;
while (depth > 0 && i < h.length) {
  const no = h.indexOf('<div', i);
  const nc = h.indexOf('</div>', i);
  if (nc === -1) break;
  if (no !== -1 && no < nc) { depth++; i = no + 4; }
  else { depth--; i = nc + 6; }
}
h = h.slice(0, relSectionStart) + h.slice(i);
console.log('2. Related posts removed');

// 3. Find and remove sidebar
const sbLabel = h.indexOf('widget-area secondary');
const sbStart = h.lastIndexOf('<div', sbLabel);
depth = 1; i = sbStart + 4;
while (depth > 0 && i < h.length) {
  const no = h.indexOf('<div', i);
  const nc = h.indexOf('</div>', i);
  if (nc === -1) break;
  if (no !== -1 && no < nc) { depth++; i = no + 4; }
  else { depth--; i = nc + 6 };
}
h = h.slice(0, sbStart) + h.slice(i);
console.log('3. Sidebar removed');

fs.writeFileSync(path, h, 'utf8');
console.log('Post updated!');