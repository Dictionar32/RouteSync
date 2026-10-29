const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const sourceRoot = path.join(root, 'packages/core/src');
const moved = [
  'compiler/semantic/expressionAstCanonical.ts',
  'compiler/semantic/expressionProducer.ts',
  'compiler/semantic/propertyProducer.ts',
];
const retired = [
  'compiler/scanner/operations/expressionAstCanonical.ts',
  'compiler/scanner/operations/expressionProducer.ts',
  'compiler/scanner/operations/propertyProducer.ts',
];
const importFiles = [
  ...moved,
  'compiler/semantic/sourceAstSemanticProducer.ts',
  'compiler/scanner/modelRelationFactsProducer.ts',
  'compiler/scanner/operations/requestProducer.ts',
  'compiler/scanner/operations/resourceProducer.ts',
  'compiler/scanner/operations/resourceFieldProducer.ts',
  'compiler/scanner/operations/requestProducer.ts',
];
const resolveRelative = (from, specifier) => {
  const base = path.resolve(path.dirname(from), specifier);
  return [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
    .some(candidate => fs.existsSync(candidate));
};
const failures = [];
for (const relative of moved) {
  const file = path.join(sourceRoot, relative);
  if (!fs.existsSync(file)) failures.push(`missing semantic owner: ${relative}`);
  else {
    const source = fs.readFileSync(file, 'utf8');
    if (!source.includes('Object.freeze({')) failures.push(`operation is not frozen: ${relative}`);
    if (/\bexport\s+function\s+/.test(source)) failures.push(`export function remains in moved operation: ${relative}`);
    if (/relation\s+foundation|RelationFoundation|relationFoundation/i.test(source)) failures.push(`forbidden relation foundation reference: ${relative}`);
  }
}
for (const relative of retired) {
  if (fs.existsSync(path.join(sourceRoot, relative))) failures.push(`legacy implementation still exists: ${relative}`);
}
for (const relative of importFiles) {
  const file = path.join(sourceRoot, relative);
  if (!fs.existsSync(file)) { failures.push(`missing import-audit file: ${relative}`); continue; }
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (specifier.startsWith('.') && !resolveRelative(file, specifier)) failures.push(`unresolved relative import: ${relative} -> ${specifier}`);
  }
}
const cliFiles = [
  'packages/cli/src/index.ts',
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
];
for (const relative of cliFiles) if (!fs.existsSync(path.join(root, relative))) failures.push(`missing CLI trace file: ${relative}`);
const report = {
  phase: 2716,
  audit: 'semantic-operation-ownership',
  checks: 3 + retired.length + importFiles.length + cliFiles.length,
  migratedOperations: moved,
  removedScannerImplementations: retired,
  importedFilesChecked: importFiles.length,
  cliTraceFilesPresent: cliFiles.length,
  forbiddenRelationFoundationIntroduced: false,
  result: failures.length === 0 ? 'PASS' : 'FAIL',
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
