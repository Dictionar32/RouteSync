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
const invocationContract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const responseContract = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');

check('canonical declaration authority contract returns source-bearing correspondence ADT', contract.includes('ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>') && contract.includes('readonly correspondences:'));
check('runtime authority returns source and judgment as one structural value', authority.includes("kind: 'controller_declaration_semantic_correspondence' as const") && authority.includes("kind: 'controller_declaration_source_identity_mismatch' as const") && authority.includes('source: subject.source') && authority.includes('selection: judgeCandidate(subject.candidate, inventory)'));
check('scanner interface documents source-bearing correspondence as canonical pairing', scannerContract.includes('source-bearing correspondence') && scannerContract.includes('do not'));
check('scanner consumes source-bearing correspondences without index-based zip', scanner.includes('const declarationsWithSelections = Object.freeze(declarationCorrespondences.flatMap(correspondence'));
check('scanner executor consumes paired declarations', scanner.includes('for (const item of declarationsWithSelections)'))
check('scanner no longer performs source-file relation lookup to rediscover selection', !scanner.includes('declarationSemanticSelections.find(selection => laravelSourceIdentitySemantics.relateSourceFiles'));
check('scanner does not pair independent selection and declaration arrays', !scanner.includes('declarationSemanticSelections[index]') && !scanner.includes('declarationSemanticSelections.find('));
check('invocation judgment remains a closed discriminated union', invocationContract.includes('export type LaravelControllerInvocationSemanticJudgmentInterface ='));
check('integrated response remains generic over exact invocation judgment', responseContract.includes('LaravelControllerIntegratedResponseJudgment<\n  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface'));
check('AST projection forwards exact invocation and response judgment pair', invocationContract.includes('responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>'));
check('controller scanner has no direct relation imports', !scanner.includes('semantic/relations') && !scanner.includes('semantic/foundation'))
check('legacy subscanner binding is isolated in explicit composition module', !scanner.includes('../subscanners/') && read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts').includes("from '../subscanners/controller'"))

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`RESULT ${checks.filter(item => item.passed).length}/${checks.length}\n`);
if (checks.some(item => !item.passed)) process.exitCode = 1;
