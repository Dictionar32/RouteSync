const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scannerInterface = read('packages/core/src/types/upstream/scannerTokenStructureInterface.ts');
const scannerAlgebra = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerTokenStructureInterface.phase1440.test.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const targetRoots = [
  'packages/core/src/types/upstream',
  'packages/cli/src',
  'packages/core/src/manifest',
  'packages/core/src/compiler/ir',
];
const sourceFiles = targetRoots.flatMap(relative => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return [];
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(child) : entry.isFile() && entry.name.endsWith('.ts') ? [child] : [];
  });
  return walk(absolute);
});
const counts = sourceFiles.reduce((result, file) => {
  const source = fs.readFileSync(file, 'utf8');
  result.exportFunction += (source.match(/^\s*export\s+(?:async\s+)?function\s+/gm) || []).length;
  result.exportArrow += (source.match(/^\s*export\s+const\s+[\w$]+\s*=\s*(?:async\s*)?\(/gm) || []).length;
  result.relationImports += (source.match(/from\s+['"][^'"]*semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)['"]/g) || []).length;
  return result;
}, { exportFunction: 0, exportArrow: 0, relationImports: 0 });
const checks = [
  ['scanner judgment exposes continueWith', scannerInterface.includes('readonly continueWith: <Result>')],
  ['found judgment delegates to domain handler', scannerInterface.includes('handlers.found(occurrence)')],
  ['not-found judgment delegates to domain handler', scannerInterface.includes('handlers.notFound()')],
  ['malformed judgment delegates to domain handler', scannerInterface.includes('handlers.malformed(failure)')],
  ['scanner runtime facade is interface typed', /scannerTokenStructureInterface:\s*ScannerTokenStructureInterface\s*=\s*Object\.freeze/.test(scannerAlgebra)],
  ['scanner no longer imports deleted relationalSequence foundation', !scannerAlgebra.includes("semantic/relations/relationalSequence")],
  ['navigation arithmetic is scanner-owned', scannerAlgebra.includes('ScannerTokenNavigationInterface') && scannerAlgebra.includes('scannerTokenNavigation.advance')],
  ['regression test exercises domain continuation', test.includes('judgment.continueWith(')],
  ['upstream collections remains empty', collections.trim().length === 0],
];
const report = {
  phase: 2978,
  title: 'Fully Explicit Simplicity — Typed Runtime Scanner Operations',
  scope: ['core/types/upstream scanner token occurrence judgment', 'scanner token navigation ownership', 'upstream → CLI → manifest → IR structural inventory'],
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  inventory: { scannedTypeScriptFiles: sourceFiles.length, remainingExportFunctionDeclarations: counts.exportFunction, remainingExportArrowDeclarations: counts.exportArrow, remainingDirectImportsFromDeletedRelationFoundationModules: counts.relationImports },
  limitation: 'Structural audit only. It does not prove full migration, full typecheck, or runtime build. Export-declaration inventory is backlog evidence, not a pass condition.',
};
fs.writeFileSync(path.join(root, 'PHASE2978_EXPLICIT_SCANNER_OPERATIONS_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PHASE2978 ${report.passed}/${report.total} structural checks passed`);
console.log(JSON.stringify(report.inventory, null, 2));
if (report.passed !== report.total) process.exitCode = 1;
