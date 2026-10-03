const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../packages/core/src');
const targets = [
  'semantic/kernel/semanticDecisionEngine.ts',
  'semantic/kernel/semanticDecisionCalculus.ts',
  'semantic/kernel/semanticRelations.ts',
  'semantic/kernel/semanticConstructRelations.ts',
  'semantic/kernel/syntax/presenceRelations.ts',
  'semantic/kernel/syntax/relationalCursorAuthority.ts',
  'semantic/kernel/syntax/tokenCursorRelations.ts',
  'semantic/kernel/syntax/parserAdapterRelations.ts',
  'semantic/kernel/syntax/constraintRuleRelations.ts',
  'semantic/kernel/syntax/syntaxEvidenceClosure.ts',
  'compiler/constraints/solver/declarativeConstraintProgram.ts',
  'compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'semantic/plugins/expression/ternaryHandler.ts',
];
const forbidden = /\b(if|while|for|switch|undefined|null)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas\b/g;
const violations = [];
for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const hits = text.match(forbidden) || [];
  if (hits.length) violations.push({ file: rel, count: hits.length, hits: [...new Set(hits)] });
}
const result = { phase: 347, violations };
console.log(JSON.stringify(result, null, 2));
process.exitCode = violations.length ? 1 : 0;
