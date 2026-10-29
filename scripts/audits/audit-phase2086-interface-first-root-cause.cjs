const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (label, condition) => checks.push({ label, pass: Boolean(condition) });

const declarationInterface = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const declarationAuthority = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts');
const invocationInterface = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const invocationAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const trace = read('PHASE2086_INTERFACE_FIRST_ROOT_CAUSE_TRACE.md');

check('existing declaration closure contract is evolved in place', declarationInterface.includes('export type ControllerDeclarationAncestryClosure ='));
check('lattice order, bottom, join, transfer, and monotonicity are explicit', ['subset_by_canonical_class_identity', 'empty_identity_set', 'set_union', 'add-one-resolved-parent-identity-or-reach-boundary', 'seen-identities-only-grow'].every((value) => declarationInterface.includes(value)));
check('finite-height bound is part of the existing certificate', declarationInterface.includes('readonly heightBound: number') && declarationAuthority.includes('heightBound: inventory.length'));
check('ancestry walk checks identity repetition before adding an ancestor', declarationAuthority.includes('seen.some(item => sameClassIdentity(item.classIdentity, parent.classIdentity))') && declarationAuthority.indexOf('seen.some(item => sameClassIdentity(item.classIdentity, parent.classIdentity))') < declarationAuthority.indexOf('seen.push(parent)'));
check('invocation judgment retains four outcome-correlated response variants', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every((kind) => invocationInterface.includes(`php_source_invocation_integration_${kind}`)));
check('invocation authority composes existing binding and integration authorities', invocationAuthority.includes('this.dependencies.sourceBinding.bind') && invocationAuthority.includes('this.dependencies.integration.project'));
check('scanner artifact remains an outcome-correlated discriminated ADT', scannerInterface.includes('export type LaravelControllerScanArtifact =') && scannerInterface.includes('LaravelControllerInvocationOutcome'));
check('integrated response and AST projection remain owned by existing pipeline contracts', responseInterface.includes('judgeIntegratedResponse') && responseInterface.includes('astProjection'));
check('scanner still has relation and subscanner debt and is not falsely marked clean', scanner.includes("../../../semantic/relations/") && scanner.includes("../operations/controller") && scanner.includes('scanControllerAction'));
check('trace explicitly documents limitations and avoids claiming full migration', trace.includes('Still unresolved (explicitly not claimed as fixed)') && trace.includes('not a claim that the Laravel scanner has been fully migrated'));

for (const result of checks) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.label}`);
const failed = checks.filter((result) => !result.pass);
console.log(`RESULT ${checks.length - failed.length}/${checks.length}`);
if (failed.length > 0) process.exitCode = 1;
