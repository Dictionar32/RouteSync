const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/semanticConstructRelations.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/kernel/requirementSolver.ts',
];
const patterns = [
  /\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bswitch\s*\(/g,
  /\.map\s*\(/g, /\.filter\s*\(/g, /\.reduce\s*\(/g, /\.flatMap\s*\(/g,
  /\bundefined\b/g, /\?\?/g, /\bnull\b/g, /===/g, /!==/g, /\bas\s+[A-Za-z_$][A-Za-z0-9_$<>{}\[\].|, ]*/g,
];
const result = Object.fromEntries(files.map(file => {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const hits = patterns.flatMap(re => [...text.matchAll(re)].map(m => ({pattern: re.source, index: m.index})));
  return [file, hits];
}));
console.log(JSON.stringify({phase:367, result}, null, 2));
const violations = Object.values(result).reduce((n, v) => n + v.length, 0);
process.exitCode = violations ? 1 : 0;
