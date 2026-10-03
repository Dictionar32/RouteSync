const fs = require('fs');
const path = require('path');
const roots = [
  'packages/core/src/semantic/kernel/semanticConstructRelations.ts',
  'packages/core/src/semantic/kernel/syntax/presenceRelations.ts',
  'packages/core/src/semantic/kernel/syntax/relationalCursorAuthority.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/semantic/kernel/syntax/constraintRuleRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxGrammar.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxNavigation.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxCursorWitness.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/compiler/constraints/solver/constraintStep.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
];
const forbidden = /\b(if|while|for|switch|undefined|null)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas\b/g;
const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const violations = roots.flatMap(file => {
  const source = stripComments(fs.readFileSync(path.resolve(file), 'utf8'));
  return [...source.matchAll(forbidden)].map(match => ({ file, index: match.index, token: match[0] }));
});
process.stdout.write(JSON.stringify({ phase: 346, violations }, null, 2));
process.exitCode = violations.length ? 1 : 0;
