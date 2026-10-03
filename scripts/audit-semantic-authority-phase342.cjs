const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || 'packages/core/src');
const targets = [
  'semantic/kernel/syntax/syntaxEvidenceRelations.ts',
  'semantic/kernel/syntax/parserAdapterRelations.ts',
  'compiler/constraints/solver/declarativeConstraintRelations.ts',
];
const forbidden = /\b(?:if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bundefined\b|\?\?|===|!==|\bas\b/;
const violations = [];
for (const relative of targets) {
  const file = path.join(root, relative);
  const source = fs.readFileSync(file, 'utf8');
  if (forbidden.test(source)) violations.push(relative);
}
if (violations.length) {
  console.error(`Phase 342 semantic authority violations: ${violations.length}`);
  process.exitCode = 1;
} else {
  console.log('Phase 342 semantic authority violations: 0');
}
