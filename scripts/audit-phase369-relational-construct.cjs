const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/semanticConstructRelations.ts',
  'packages/core/src/semantic/kernel/semanticEvidenceRelations.ts',
  'packages/core/src/semantic/kernel/semanticUnknownRelations.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
];
const patterns = [
  /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bswitch\s*\(/g,
  /\.map\s*\(/g, /\.filter\s*\(/g, /\.reduce\s*\(/g, /\.flatMap\s*\(/g,
  /\bundefined\b/g, /\?\?/g, /(?<!['"`])\bnull\b/g,
  /===/g, /!==/g, /\bas\s+(?!const\b)/g, /\bunknown\b/g,
];
const result = {};
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const hits = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    const n = (text.match(re) || []).length;
    if (n) hits.push([re.source, n]);
  }
  result[file] = Object.fromEntries(hits);
}
console.log(JSON.stringify({ phase: 369, result }, null, 2));
