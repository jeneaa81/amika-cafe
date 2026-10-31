const fs = require('fs');

const html = fs.readFileSync('public/tv.html', 'utf8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error('No <script> tag found in public/tv.html');
  process.exit(1);
}

const code = scriptMatch[1];
const hasLet = /\blet\s+[a-zA-Z_$]/.test(code);
const hasConst = /\bconst\s+[a-zA-Z_$]/.test(code);
const hasArrow = /(=>\s*\{|=>\s*[a-zA-Z0-9_$"'`])/.test(code);
const hasBacktick = code.includes(String.fromCharCode(96));
const hasAsync = /\basync\s+function\b/.test(code);

console.log('--- ES5 AUDIT ---');
console.log('hasLet:', hasLet);
console.log('hasConst:', hasConst);
console.log('hasArrow:', hasArrow);
console.log('hasBacktick:', hasBacktick);
console.log('hasAsync:', hasAsync);

if (hasLet || hasConst || hasArrow || hasBacktick || hasAsync) {
  console.error('ES6 features detected in public/tv.html script!');
  process.exit(1);
}

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const css = styleMatch ? styleMatch[1] : '';

console.log('--- CSS AUDIT ---');
const hasGap = /[^a-zA-Z-]gap\s*:/.test(css);
const hasInset = /[^a-zA-Z-]inset\s*:/.test(css);
const hasSpaceEvenly = /space-evenly/.test(css);

console.log('hasGap:', hasGap);
console.log('hasInset:', hasInset);
console.log('hasSpaceEvenly:', hasSpaceEvenly);

if (hasGap || hasInset || hasSpaceEvenly) {
  console.error('Forbidden modern CSS detected in public/tv.html!');
  process.exit(1);
}

console.log('ALL AUDITS PASSED!');
