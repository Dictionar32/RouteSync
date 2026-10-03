const fs = require('fs');
const files = [
  'packages/core/src/semantic/kernel/semanticEvidenceRelations.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
  'packages/core/src/semantic/kernel/requirementSolver.ts',
  'packages/core/src/semantic/kernel/semanticConstructRelations.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const patterns = {
  hostIf: /\bif\s*\(/g,
  hostFor: /\bfor\s*\(/g,
  hostWhile: /\bwhile\s*\(/g,
  hostSwitch: /\bswitch\s*\(/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefinedLiteral: /\bundefined\b/g,
  nullish: /\?\?/g,
  strictEquality: /===|!==/g,
  typeAssertion: /\bas\s+(?!const\b)/g,
};
const result = {};
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  result[file] = {};
  for (const [name, pattern] of Object.entries(patterns)) {
    const hits = source.match(pattern);
    if (hits) result[file][name] = hits.length;
  }
}
console.log(JSON.stringify({ phase: 368, result }, null, 2));
