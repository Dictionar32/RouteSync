const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const cli = path.join(root, 'packages/cli/src/generators');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) files.push(full);
  }
}
walk(cli);
const forbidden = [
  /route\.raw\.(?:path|method|auth|schema|response|identity|binding|capability)/,
  /\broute\.(?:path|pathParameters|schema|response|auth)\b/,
];
const findings = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (forbidden.some(re => re.test(line))) findings.push({ file: path.relative(root, file), line: i + 1, text: line.trim() });
  });
}
const report = {
  phase: 878,
  scope: 'packages/cli/src/generators production TypeScript',
  forbiddenPatterns: forbidden.map(String),
  findings,
  clean: findings.length === 0,
};
fs.writeFileSync(path.join(__dirname, 'phase878-route-downstream-authority.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(findings.length ? 1 : 0);
