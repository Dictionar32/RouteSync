const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const patterns = [
  /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bswitch\s*\(/g,
  /\.map\s*\(/g, /\.filter\s*\(/g, /\.reduce\s*\(/g, /\.flatMap\s*\(/g,
  /\bundefined\b/g, /\?\?/g, /(^|[^A-Za-z0-9_])null([^A-Za-z0-9_]|$)/g,
  /===/g, /!==/g, /\bas\b/g,
];
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const result = {};
for (const rel of files) {
  const source = stripComments(fs.readFileSync(path.join(root, rel), 'utf8'));
  const hits = {};
  for (const p of patterns) {
    const key = p.source;
    const n = (source.match(p) || []).length;
    if (n) hits[key] = n;
  }
  result[rel] = hits;
}
console.log(JSON.stringify({ phase: 366, result }, null, 2));
