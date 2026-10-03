const fs = require('fs');
const path = require('path');
const root = path.resolve('packages/core/src');
const tests = /(?:__tests__|__test__|\.test\.|\.spec\.)/;
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.ts')) files.push(p);
  }
}
walk(root);
const texts = new Map(files.map(f => [f, fs.readFileSync(f, 'utf8')]));
const activeText = files.map(f => texts.get(f)).join('\n');
const candidates = files.filter(f => {
  const rel = path.relative(root, f);
  if (tests.test(rel) || path.basename(f) === 'index.ts' || rel.includes('__archive__')) return false;
  const body = texts.get(f);
  const name = path.basename(f, '.ts');
  const externalText = files.filter(other => other !== f).map(other => texts.get(other)).join('\n');
  return body.length > 0 && !externalText.includes(name);
});
const nonEmpty = candidates.filter(f => fs.readFileSync(f, 'utf8').length !== 0);
const report = {
  phase: 525,
  rule: 'non-test TypeScript file with no textual basename references anywhere in core source is an inactive-file candidate',
  candidates: candidates.map(f => path.relative(root, f)),
  remainingNonEmptyCandidates: nonEmpty.map(f => path.relative(root, f)),
  allCandidatesEmpty: nonEmpty.length === 0,
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(report, null, 2));
process.exit(nonEmpty.length === 0 ? 0 : 1);
