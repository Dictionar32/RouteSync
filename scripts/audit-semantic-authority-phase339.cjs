const fs = require('fs');
const path = require('path');
const roots = [
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/tokenCursor.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxGrammar.ts',
  'packages/core/src/semantic/kernel/requirementSolver.ts',
  'packages/core/src/semantic/kernel/semanticDecisionEngine.ts',
  'packages/core/src/semantic/kernel/semanticDecisionCalculus.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const rules = [
  ['if', /\bif\b/g], ['while', /\bwhile\b/g], ['for', /\bfor\b/g], ['switch', /\bswitch\b/g],
  ['map', /\.map\s*\(/g], ['filter', /\.filter\s*\(/g], ['reduce', /\.reduce\s*\(/g], ['flatMap', /\.flatMap\s*\(/g],
  ['undefined', /\bundefined\b/g], ['null', /\bnull\b/g], ['??', /\?\?/g], ['===', /===/g], ['!==', /!==/g],
  ['as', /\bas\b/g], ['relationResolve', /\brelationResolve\b/g],
];
let total = 0;
for (const file of roots) {
  const text = fs.readFileSync(path.resolve(file), 'utf8');
  for (const [name, re] of rules) {
    const count = [...text.matchAll(re)].length;
    if (count) { total += count; console.log(`${file}: ${name}=${count}`); }
  }
}
console.log(`phase339-authority-hits=${total}`);
process.exitCode = total ? 1 : 0;
