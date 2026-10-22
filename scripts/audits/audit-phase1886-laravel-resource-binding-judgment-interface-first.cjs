const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const consumer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const implementation = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/subscanners/controller';
const checks = [
  ['resource binding has an upstream authority interface with a closed judgment', /ControllerResourceBindingAuthorityInterface/.test(contract) && /ControllerResourceBindingJudgment/.test(contract) && /closed: true/.test(contract)],
  ['semantic model origin evidence preserves variable and static-call judgments', /variable_semantic_judgment/.test(contract) && /static_call_origin_input/.test(contract) && /ControllerVariableSemanticJudgment/.test(contract) && /ControllerStaticCallOriginInput/.test(contract)],
  ['judgment correlates resource identity, model origin, and response identity', /resourceName: ResourceName/.test(contract) && /model: ControllerModelOrigin/.test(contract) && /response: ResponseReference/.test(contract) && /closed_model_origin_judgment_and_canonical_controller_response_are_correlated/.test(contract) && /readonly response: ControllerResponse/.test(contract) && /responseContractRule: 'reuse_controller_response_without_duplicate_response_evidence_union'/.test(contract)],
  ['authority owns model-origin interpretation from upstream judgments', /judgeModelOrigin/.test(authority) && /evidence\.judgment\.semantic\.kind/.test(authority) && /judgment\.origin/.test(authority)],
  ['authority keeps missing model, missing response, and invalid collection argument outcomes distinct', /model_origin_missing/.test(contract) && /model_origin_unresolved/.test(contract) && /response_absent/.test(contract) && /collection_argument_absent/.test(contract) && /collection_argument_unsupported/.test(contract)],
  ['scanner consumer submits typed candidates and consumes resolved judgments', /controllerResourceBindingAuthority\.judge\(resourceBindingCandidate\(value, semanticIndex, response, modelClasses\)\)/.test(consumer) && /candidate\.kind, 'resolved'/.test(consumer)],
  ['scanner no longer owns the old model-origin resolver', !/function resolveModelOrigin\(/.test(consumer) && !/function toDomainModelOrigin\(/.test(consumer)],
  ['AST adapter preserves upstream variable judgments instead of interpreting their semantic variants', /function modelOriginEvidence/.test(consumer) && /variable_semantic_judgment/.test(consumer) && !/resolved\.semantic\.kind/.test(consumer)],
  ['collection-call argument shape is preserved as typed evidence', /staticCollectionModelOriginEvidence/.test(consumer) && /unsupported_argument_shape/.test(consumer) && /kind: 'positional'/.test(consumer)],
  ['upstream barrel exports the new interface and authority', /export \* from '\.\/controllerResourceBindingInterface'/.test(barrel) && /export \{ controllerResourceBindingAuthority \}/.test(barrel)],
  ['scanner contract and implementation versions advance together', (boundary.match(/readonly contractVersion: 26;/g) || []).length === 2 && (implementation.match(/contractVersion: 26,/g) || []).length === 2 && /readonly version: 109/.test(boundary) && /version: 109,/.test(boundary)],
  ['previously emptied controller files remain empty', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0 && fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(contract + authority + consumer)],
  ['audit is registered in package.json', packageJson.scripts['audit:phase1886-laravel-resource-binding-judgment-interface-first'] === 'node scripts/audits/audit-phase1886-laravel-resource-binding-judgment-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
