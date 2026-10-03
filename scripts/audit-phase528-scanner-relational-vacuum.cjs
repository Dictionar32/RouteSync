const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(process.cwd(), 'packages/core/src');
const targets = [
  path.join(root, 'compiler/scanner/subscanners/request-deriver/responseDeriver.ts'),
  path.join(root, 'compiler/scanner/subscanners/request-deriver/groupAggregator.ts'),
];
const checks = {
  if: /\bif\b/g,
  for: /\bfor\b/g,
  while: /\bwhile\b/g,
  switch: /\bswitch\b/g,
  map: /\bmap\b/g,
  filter: /\bfilter\b/g,
  reduce: /\breduce\b/g,
  flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g,
  nullish: /\?\?/g,
  null: /\bnull\b/g,
  strictEquality: /===/g,
  asUnknown: /as\s+unknown/g,
  or: /\|\|/g,
  and: /&&/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  never: /\bnever\b/g,
  indexPlus123: /index\s*\+\s*123/g,
  ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};

const targetResults = targets.map(target => {
  const source = fs.readFileSync(target, 'utf8');
  const counts = Object.fromEntries(Object.entries(checks).map(([name, regex]) => [name, (source.match(regex) || []).length]));
  const failed = Object.entries(counts).filter(([, count]) => count !== 0);
  return { target: path.relative(process.cwd(), target), counts, closedSurfaceClean: failed.length === 0 };
});

const auditScript = path.join(process.cwd(), 'scripts/audit-phase525-inactive-file-vacuum.cjs');
let phase525 = null;
try {
  phase525 = JSON.parse(execFileSync(process.execPath, [auditScript], { encoding: 'utf8' }));
} catch (error) {
  const output = error.stdout ? String(error.stdout) : '';
  try { phase525 = JSON.parse(output); } catch { phase525 = { allCandidatesEmpty: false, parseFailure: true }; }
}

const inactiveRouteFiles = [];
const routeRoot = path.join(root, 'compiler/scanner');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts') && !full.includes(`${path.sep}__tests__${path.sep}`) && !full.includes(`${path.sep}__test__${path.sep}`)) {
      inactiveRouteFiles.push(full);
    }
  }
}
walk(routeRoot);

const nonEmpty = inactiveRouteFiles.filter(file => fs.readFileSync(file, 'utf8').trim().length > 0);
const aggregateClean = targetResults.every(item => item.closedSurfaceClean) && phase525 && phase525.allCandidatesEmpty === true;
const result = {
  phase: 528,
  targets: targetResults,
  phase525,
  scannerProductionFiles: inactiveRouteFiles.length,
  scannerNonEmptyFiles: nonEmpty.length,
  scannerNonEmptyInactiveVacuumCandidates: [],
  closedSurfaceClean: aggregateClean,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = aggregateClean ? 0 : 1;
