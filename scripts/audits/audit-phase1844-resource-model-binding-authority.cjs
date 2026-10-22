const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const semantic = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const resourceInterface = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const controllerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['authority implements the existing upstream resource-binding judgment authority', /ResourceModelBindingJudgmentAuthority/.test(authority) && /kind: 'resource_model_binding_judgment_authority'/.test(authority)],
  ['judgment input uses the complete controller scan, not detached action arrays', /readonly controllerScan: LaravelControllerScanJudgment/.test(semantic) && /input\.controllerScan\.controllers/.test(authority) && !/controllerActions/.test(authority)],
  ['controller-return evidence is matched to the exact resource and model origin', /resource_model_class_origin/.test(authority) && /resource-model-controller-class-origin/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts')) && /binding\.resource\.name\.value\.value/.test(authority)],
  ['candidate model is supported by source-correlated evidence', /resource_model_candidate_provenance/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts')) && /sourceSpanKey/.test(authority) && /evidence: nonEmptyEvidence/.test(authority)],
  ['unresolved outcomes preserve explicit evidence and relation-related reason', /kind: 'unresolved'/.test(authority) && /no_model_candidate/.test(authority) && /relation_binding_unresolved/.test(authority) && /sourceEvidence\(input\)/.test(authority)],
  ['ambiguous model candidates remain a distinct judgment outcome', /kind: 'ambiguous'/.test(authority) && /ambiguousCandidates/.test(authority)],
  ['resource scanner interface preserves AST/definition only for a resolved model judgment', /readonly modelBinding: ResolvedResourceModelBindingJudgment/.test(resourceInterface) && /readonly ast: ResourceAst/.test(resourceInterface) && /readonly definition: ResourceDefinition/.test(resourceInterface) && /LaravelResourceRejectedArtifact/.test(resourceInterface)],
  ['controller artifact retains resource evidence beside integrated invocation judgment', /readonly resourceBindings: readonly ControllerResourceBindingEvidence\[\]/.test(controllerInterface) && /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controllerInterface)],
  ['authority does not depend on semantic foundation or unsafe casts', !/semantic\/foundation/.test(authority) && !/\bas\s+(?:const|unknown|any)\b/.test(authority)],
  ['resource authority is now wired into the production pipeline', /laravelResourceScanner\.scan/.test(pipeline) && /resourceModelBindingAuthority/.test(pipeline) && !/ResourceScanner\.scanCanonicalBundle/.test(pipeline)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1844-resource-model-binding-authority'] === 'node scripts/audits/audit-phase1844-resource-model-binding-authority.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
