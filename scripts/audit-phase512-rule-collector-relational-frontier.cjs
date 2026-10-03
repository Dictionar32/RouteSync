const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const scanner = path.join(root, 'packages/core/src/compiler/scanner');
const forbidden = [
  ['if', /\bif\b/g], ['for', /\bfor\b/g], ['while', /\bwhile\b/g], ['switch', /\bswitch\b/g],
  ['map', /\bmap\b/g], ['filter', /\bfilter\b/g], ['reduce', /\breduce\b/g], ['flatMap', /\bflatMap\b/g],
  ['undefined', /\bundefined\b/g], ['nullish', /\?\?/g], ['strictEquality', /===/g], ['as unknown', /\bas\s+unknown\b/g],
  ['or', /\|\|/g], ['and', /&&/g], ['trim', /\.trim\s*\(/g], ['slice', /\.slice\s*\(/g],
  ['never', /\bnever\b/g], ['ternary', /(?<!\?)\?(?!\.)[^\n:;{}]+:/g],
];
const closed = new Set([
  'lexer/astClassifierEvidence.ts',
  'subscanners/providerAstCanonical.ts', 'subscanners/migrationProducer.ts', 'subscanners/serviceAstCanonical.ts',
  'subscanners/controller/controllerDataflowContract.ts', 'subscanners/serviceSourceStatements.ts',
  'subscanners/form-request/canonicalValidationRuleEntry.ts', 'subscanners/form-request/validationFieldAssembler.ts',
  'descriptors/request/controllerExpressionContract.ts', 'subscanners/resource/resourceFieldProducer.ts',
  'descriptors/validation/validationRuleEntry.ts', 'descriptors/manifest/resourceRouteGroupDescriptor.ts',
  'subscanners/controller/responseAttributeScanner.ts', 'subscanners/orchestrator/sourceAstScanner.ts',
  'subscanners/resource/resourceUpstreamExpressionCanonical.ts',
  'subscanners/form-request/ruleCollector.ts',
]);
function files(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}
function eraseNonCode(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/`(?:\\.|[^`\\])*`/g, '``');
}
const rows = files(scanner).map(file => {
  const rel = path.relative(scanner, file).replaceAll('\\', '/');
  const source = eraseNonCode(fs.readFileSync(file, 'utf8'));
  const counts = Object.fromEntries(forbidden.map(([name, rx]) => [name, source.match(rx)?.length ?? 0]));
  return { file: rel, total: Object.values(counts).reduce((a, b) => a + b, 0), counts, closed: closed.has(rel) };
});
const closedRows = rows.filter(row => row.closed);
const frontier = rows.filter(row => !row.closed && row.total > 0).sort((a, b) => b.total - a.total);
console.log(JSON.stringify({ phase: 512, closedSurface: closedRows, remainingFrontier: frontier.slice(0, 40), closedSurfaceClean: closedRows.every(row => row.total === 0) }, null, 2));
