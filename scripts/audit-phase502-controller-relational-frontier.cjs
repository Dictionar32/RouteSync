const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const scanner = path.join(root, 'packages/core/src/compiler/scanner');
const forbidden = [
  ['if', /\bif\b/g],
  ['for', /\bfor\b/g],
  ['while', /\bwhile\b/g],
  ['switch', /\bswitch\b/g],
  ['map', /\bmap\b/g],
  ['filter', /\bfilter\b/g],
  ['reduce', /\breduce\b/g],
  ['flatMap', /\bflatMap\b/g],
  ['undefined', /\bundefined\b/g],
  ['nullish', /\?\?/g],
  ['strictEquality', /===/g],
  ['as unknown', /\bas\s+unknown\b/g],
  ['or', /\|\|/g],
  ['and', /&&/g],
  ['trim', /\.trim\s*\(/g],
  ['slice', /\.slice\s*\(/g],
  ['ternary', /(?<!\?)\?(?!\.)[^\n:;{}]+:/g],
];

const closed = new Set([
  'subscanners/InvalidationResolver.ts',
  'subscanners/controller/controllerBodyResolver.ts',
  'descriptors/route/routeResourceSemanticResolver.ts',
  'upstream/route/routeResourceSemanticResolver.ts',
  'semantic/route/routeMiddlewareResolver.ts',
  'upstream/route/routeGroupSemanticResolver.ts',
  'binders/resource/composite/literalTernaryBinders.ts',
  'lexer/astClassifierEvidence.ts',
  'subscanners/providerAstCanonical.ts',
    'subscanners/migrationProducer.ts',
  'subscanners/serviceAstCanonical.ts',
  'subscanners/controller/controllerDataflowContract.ts',
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
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

const all = files(scanner);
const rows = all.map(file => {
  const rel = path.relative(scanner, file).replaceAll('\\', '/');
  const source = eraseNonCode(fs.readFileSync(file, 'utf8'));
  const counts = Object.fromEntries(forbidden.map(([name, rx]) => [name, source.match(rx)?.length ?? 0]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { file: rel, total, counts, closed: closed.has(rel) };
}).filter(row => row.total > 0 || row.closed);

const frontier = rows.filter(row => !row.closed).sort((a, b) => b.total - a.total);
const closedRows = rows.filter(row => row.closed);
console.log(JSON.stringify({
  phase: 502,
  closedSurface: closedRows,
  remainingFrontier: frontier.slice(0, 40),
  closedSurfaceClean: closedRows.every(row => row.total === 0),
}, null, 2));
