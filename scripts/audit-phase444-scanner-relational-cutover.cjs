#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/scanner/lexer/tokenizer.ts',
  'packages/core/src/compiler/scanner/lexer/SourceStream.ts',
  'packages/core/src/compiler/scanner/lexer/tokenize/characterPredicates.ts',
  'packages/core/src/compiler/scanner/lexer/tokenize/compoundScanners.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts',
];

const forbidden = [
  ['if', /\bif\s*\(/g],
  ['for', /\bfor\s*\(/g],
  ['while', /\bwhile\s*\(/g],
  ['switch', /\bswitch\s*\(/g],
  ['map', /\.map\s*\(/g],
  ['filter', /\.filter\s*\(/g],
  ['reduce', /\.reduce\s*\(/g],
  ['flatMap', /\.flatMap\s*\(/g],
  ['undefined', /\bundefined\b/g],
  ['nullish', /\?\?/g],
  ['strictEquality', /===/g],
  ['as unknown', /\bas unknown\b/g],
  ['trim', /\.trim\s*\(/g],
  ['slice', /\.slice\s*\(/g],
];

let failed = false;
for (const relative of targets) {
  const file = path.join(root, relative);
  const source = fs.readFileSync(file, 'utf8');
  const counts = Object.fromEntries(forbidden.map(([name, pattern]) => [name, [...source.matchAll(pattern)].length]));
  const violations = Object.entries(counts).filter(([, count]) => count > 0);
  console.log(JSON.stringify({ file: relative, counts }));
  failed ||= violations.length > 0;
}
process.exitCode = failed ? 1 : 0;
