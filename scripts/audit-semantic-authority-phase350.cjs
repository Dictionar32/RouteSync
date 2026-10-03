const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/semantic/kernel/syntax/presenceRelations.ts',
  'packages/core/src/semantic/kernel/syntax/relationalCursorAuthority.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/semantic/kernel/syntax/syntaxEvidenceClosure.ts',
  'packages/core/src/semantic/kernel/syntax/constraintRuleRelations.ts',
  'packages/core/src/compiler/constraints/solver/declarativeConstraintProgram.ts',
  'packages/core/src/semantic/kernel/semanticDecisionEngine.ts',
  'packages/core/src/semantic/kernel/semanticDecisionCalculus.ts',
  'packages/core/src/compiler/constraints/solver/declarativeConstraintRelations.ts',
  'packages/core/src/semantic/kernel/syntax/syntaxEvidenceRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const forbidden = /\b(if|while|for|switch|undefined|null)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas\b/;
const violations = [];
for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { violations.push({ file: rel, reason: 'missing' }); continue; }
  const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  if (forbidden.test(src)) violations.push({ file: rel, reason: 'forbidden semantic construct' });
}
process.stdout.write(JSON.stringify({ phase: 350, targets: targets.length, violations }, null, 2) + '\n');
process.exitCode = violations.length ? 1 : 0;
