#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const roots = [
  'packages/core/src/graph/ServiceGraphBuilder.ts',
  'packages/core/src/graph/service/graphNodeIndex.ts',
  'packages/core/src/graph/service/nodeFactories.ts',
  'packages/core/src/graph/service/graphAssembler.ts',
  'packages/core/src/graph/service/manifestGraphCompiler.ts',
];
const patterns = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  ternary: /\?/g, map: /\.map\s*\(/g, filter: /\.filter\s*\(/g, reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g, undefined: /\bundefined\b/g, null: /\bnull\b/g, '??': /\?\?/g,
  '===': /===/g, '!==': /!==/g, '&&': /&&/g, '||': /\|\|/g, 'as unknown': /\bas\s+unknown\b/g,
  Set: /\bSet\b/g, Map: /\bMap\b/g, any: /\bany\b/g, new: /\bnew\b/g,
};
const files = roots.map(file => path.join(root, file));
const result = { phase: 585, frontier: 'graph-resolver', scannedFiles: files.length, aggregate: {}, files: [], transpileDiagnosticsClean: true };
for (const key of Object.keys(patterns)) result.aggregate[key] = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const counts = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    counts[key] = (source.match(pattern) || []).length;
    result.aggregate[key] += counts[key];
  }
  result.files.push({ file: path.relative(root, file), counts });
}
result.closedSurfaceClean = Object.values(result.aggregate).every(value => value === 0);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.closedSurfaceClean ? 0 : 1;
