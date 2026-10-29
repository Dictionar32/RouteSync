const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) { passed += 1; process.stdout.write(`PASS ${name}: ${detail}\n`); }
  else { failed += 1; process.stderr.write(`FAIL ${name}: ${detail}\n`); }
}
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const prep = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.statSync(collectionsPath).size;
const report = JSON.parse(read('packages/core/src/types/upstream/PHASE2807_MANIFEST_ADT_ROOT_CAUSE_TRACE.json'));
check('existing upstream result contract', /export type RequestTypeDerivationRuntimeExecutionResult\s*=/.test(upstream), 'the upstream module already owns the closed derivation ADT');
check('earliest active ADT conversion located', /switch\s*\(assessment\.kind\)/.test(prep), 'operation preparation maps semantic authority assessments to runtime outcomes');
check('lowering ADT conversion located', /switch\s*\(derivation\.kind\)/.test(lowering), 'type lowering maps projected versus non-projectable derivations');
check('projection ADT conversion removed by Phase 2809', !/switch\s*\(/.test(projection) && /type AuthorityBackedRouteManifestProjectionResult = AuthorityBackedRouteManifestTypeLoweringResult/.test(projection), 'projection now preserves the lowerer ADT without a duplicate conversion');
check('composition ADT conversion located', /switch\s*\(result\.kind\)/.test(composition), 'manifest composition maps projected versus not-projectable');
check('ADT-owned continuation replaces external dispatcher', /readonly continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\)/.test(composition) && !/switch\s*\(outcome\.kind\)/.test(composition), 'Phase 2808 attaches follow-up operation to each ADT variant');
check('scan invokes ADT continuation', /routeManifestProjection\.continue\(/.test(scan), 'scan follows the operation carried by the outcome');
check('sync invokes ADT continuation', /routeManifestProjection\.continue\(/.test(sync), 'sync follows the operation carried by the outcome');
check('no generic dispatcher contract', !/OutcomeHandlers\s*<\s*T\s*>|consume\s*<\s*T\s*>/.test(composition), 'manifest outcome contract stays concrete');
check('no never assertion in ADT continuation', !/as\s+never/.test(composition), 'no type assertion is used to force continuation');
check('collections.ts is exactly empty', collectionsBytes === 0, `actual size=${collectionsBytes} bytes`);
check('root cause is explicit in report', report.rootCause.includes('Repeated adjacent ADT translations') && report.branchSites.length === 4, 'report records the repeated ADT translation root cause');
process.stdout.write(`\nPhase 2807 root-cause audit: ${passed}/12 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
