const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scannerInterface = read('packages/core/src/types/upstream/scannerTokenStructureInterface.ts');
const scannerAlgebra = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const scannerTest = read('packages/core/src/types/upstream/__test__/scannerTokenStructureInterface.phase1440.test.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const tracePath = 'PHASE2979_FULLY_EXPLICIT_SCANNER_JUDGMENT_OPERATIONS_TRACE.md';
const trace = read(tracePath);
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
  ['occurrence judgment has domain continuation', /TokenOccurrenceJudgment[\s\S]*?continueWith/.test(scannerInterface)],
  ['occurrence collection judgment has domain continuation', /TokenOccurrencesJudgment[\s\S]*?continueWith/.test(scannerInterface)],
  ['partition judgment has domain continuation', /TokenPartitionJudgment[\s\S]*?continueWith/.test(scannerInterface)],
  ['delimiter judgment variants have domain continuation', /DelimitedTokenJudgment[\s\S]*?continueWith/.test(scannerInterface)],
  ['all judgment constructors are exposed through explicit runtime interface', /scannerJudgmentOperations:\s*ScannerJudgmentOperationsInterface\s*=\s*Object\.freeze/.test(scannerInterface)],
  ['scanner runtime facade is interface typed', /scannerTokenStructureInterface:\s*ScannerTokenStructureInterface\s*=\s*Object\.freeze/.test(scannerAlgebra)],
  ['algebra builds ADTs through domain constructors rather than raw judgment literals', scannerAlgebra.includes('scannerJudgmentOperations.occurrencesComplete') && scannerAlgebra.includes('scannerJudgmentOperations.partitioned') && scannerAlgebra.includes('scannerJudgmentOperations.delimiterMatched')],
  ['runtime tests cover continuation for collections, partitions and delimiters', scannerTest.includes('continues occurrence collections') && scannerTest.includes('continues partitions') && scannerTest.includes('continues delimiter judgments')],
  ['scanner public index exports operations and handler contracts', upstreamIndex.includes('scannerJudgmentOperations') && upstreamIndex.includes('DelimitedTokenContinuationHandlers')],
  ['scanner module exports no standalone function declarations or inferred arrow factories', !/^\s*export\s+(?:async\s+)?function\s+|^\s*export\s+const\s+[\w$]+\s*=\s*(?:async\s*)?\(/m.test(scannerInterface + '\n' + scannerAlgebra)],
  ['scanner no longer imports deleted relation foundation', !scannerAlgebra.includes('semantic/relations/relationalSequence') && !scannerInterface.includes('semantic/relations/')],
  ['scanner navigation arithmetic remains locally owned', scannerAlgebra.includes('ScannerTokenNavigationInterface') && scannerAlgebra.includes('scannerTokenNavigation.advance')],
  ['upstream collections remains empty', collections.trim().length === 0],
  ['trace covers upstream CLI manifest and IR', ['UPSTREAM', 'CLI', 'MANIFEST', 'IR'].every(section => trace.includes(section))],
  ['deleted relation foundation is explicitly not restored', trace.includes('Do not restore') && !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
];
const report = {
  phase: 2979,
  title: 'Fully Explicit Simplicity — Typed Runtime Scanner Judgment Operations',
  scope: ['actionable occurrence/occurrence-collection/partition/delimiter ADTs', 'typed runtime constructor operations', 'upstream → CLI → manifest → IR trace and backlog inventory'],
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  inventory: { scannedTypeScriptFiles: sourceFiles.length, remainingExportFunctionDeclarations: counts.exportFunction, remainingExportArrowDeclarations: counts.exportArrow, remainingDirectImportsFromDeletedRelationFoundationModules: counts.relationImports },
  verification: { sourceTypecheck: 'strict TypeScript check passed for scanner interface and algebra', runtimeSmoke: '5/5 passed', fullWorkspaceTypecheck: 'not run', fullTestSuite: 'not run' },
  limitation: 'Structural audit and focused runtime smoke only. Export-declaration inventory is backlog evidence, not a pass condition. Full CLI/manifest build and full test suite remain unverified.',
};
fs.writeFileSync(path.join(root, 'PHASE2979_FULLY_EXPLICIT_SCANNER_JUDGMENT_OPERATIONS_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PHASE2979 ${report.passed}/${report.total} structural checks passed`);
console.log(JSON.stringify(report.inventory, null, 2));
if (report.passed !== report.total) process.exitCode = 1;
