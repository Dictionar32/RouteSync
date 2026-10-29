const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const coreExports = read('packages/core/src/index.ts');
const tests = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts');

check('interface defines source-bearing semantic subject', contract.includes('interface ControllerDeclarationSemanticSubject<TSource, TMethod, TAttribute>'));
check('interface defines correlated source-plus-selection ADT', contract.includes('type ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute> ='));
check('authority interface exposes correspondence instead of parallel selection list', contract.includes('readonly correspondences:') && !contract.includes('readonly selections:'));
check('runtime authority computes selection from the same subject candidate', authority.includes('selection: judgeCandidate(subject.candidate, inventory)'));
check('runtime authority preserves exact subject reference', authority.includes('source: subject.source'));
check('scanner sends parsed source and semantic candidate as one input', scanner.includes('source: item,') && scanner.includes('candidate: Object.freeze({'));
check('scanner consumes source-bearing correspondence outcomes directly', scanner.includes('declarationCorrespondences.flatMap(correspondence =>') && scanner.includes('...correspondence.source') && scanner.includes('semanticSelection: correspondence.selection'));
check('scanner does not zip selection and declaration arrays by index', !scanner.includes('declarationSemanticSelections[index]'));
check('public core barrel exports both new contract types', coreExports.includes('ControllerDeclarationSemanticSubject, ControllerDeclarationSemanticCorrespondence'));
check('test fixture checks source reference and corresponding judgment together', tests.includes('returns each source subject beside its own judgment without a positional join'));
check('scanner contract version advanced to 31 for identity-mismatch ADT', scannerContract.includes('readonly contractVersion: 31;') && scanner.includes('contractVersion: 31 as const'));
check('controller scanner delegates legacy bindings to explicit execution composition', !scanner.includes('semantic/relations') && !scanner.includes('operations/') && read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts').includes('legacyLaravelControllerExecutionDependencies'));

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`RESULT ${checks.filter(item => item.passed).length}/${checks.length}\n`);
if (checks.some(item => !item.passed)) process.exitCode = 1;
