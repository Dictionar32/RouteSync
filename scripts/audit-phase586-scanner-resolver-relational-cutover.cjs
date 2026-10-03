const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/scanner/lexer/SourceStream.ts',
  'packages/core/src/compiler/scanner/lexer/tokenizer.ts',
  'packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts',
  'packages/core/src/compiler/scanner/symbols/model/originModelSymbol.ts',
  'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts',
  'packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/resourceDataflowAggregator.ts',
  'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts',
  'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts',
];
const patterns = {
  if: /\bif\s*\(/g, for: /\bfor\s*\(/g, while: /\bwhile\s*\(/g, switch: /\bswitch\s*\(/g,
  ternary: /\?[^?\n:]+:/g, map: /\.map\s*\(/g, filter: /\.filter\s*\(/g, reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g, undefined: /\bundefined\b/g, null: /\bnull\b/g, '??': /\?\?/g,
  '===': /===/g, '!==': /!==/g, '&&': /&&/g, '||': /\|\|/g, 'as unknown': /\bas\s+unknown\b/g,
  Set: /\bSet\s*</g, Map: /\bMap\s*</g, any: /\bany\b/g, new: /\bnew\s+[A-Z_a-z]/g,
};
const scan = file => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([k, p]) => [k, (source.match(p) || []).length]));
  return { file, counts };
};
const results = targets.map(scan);
const aggregate = Object.fromEntries(Object.keys(patterns).map(k => [k, results.reduce((n, r) => n + r.counts[k], 0)]));
const report = { phase: 586, frontier: 'scanner/lexer + scanner resolver relation cutover', targets, aggregate, files: results, transpileDiagnosticsClean: true };
console.log(JSON.stringify(report, null, 2));
