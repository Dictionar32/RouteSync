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
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const prep = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const coreIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
check('domain ADT has continuation operation', /readonly continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\) => RouteManifest/.test(composition), 'each outcome variant exposes a concrete follow-up operation');
check('success continuation owned by success variant', /continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\): RouteManifest =>\s*handlers\.manifest_projected\(outcome\)/.test(composition), 'projected outcome invokes its own success continuation');
check('blocked continuation preserves failure', /continue: \(handlers: RouteManifestProjectionCompositionOutcomeHandlers\): RouteManifest =>\s*handlers\.manifest_projection_blocked\(outcome\)/.test(composition), 'blocked outcome invokes its own terminal failure continuation');
check('CLI scan calls ADT operation', /routeManifestProjection\.continue\(/.test(scan) && !/routeManifestProjectionCompositionOutcomeOperations/.test(scan), 'scan does not route through an external kind-switch dispatcher');
check('CLI sync calls ADT operation', /routeManifestProjection\.continue\(/.test(sync) && !/routeManifestProjectionCompositionOutcomeOperations/.test(sync), 'sync does not route through an external kind-switch dispatcher');
check('external dispatcher removed', !/routeManifestProjectionCompositionOutcomeOperations/.test(composition + coreIndex), 'no duplicate outcome dispatcher is exported');
check('no generic reasoning primitive', !/OutcomeHandlers\s*<\s*T\s*>|continue\s*<\s*T\s*>|consume\s*<\s*T\s*>|as\s+never/.test(composition), 'ADT continuation is concrete and uses no generic or never assertion');
check('preparation factory is interface-first', /export const requestTypeDerivationOperationPreparationFactory:\s*RequestTypeDerivationOperationPreparationFactoryInterface\s*=\s*Object\.freeze/.test(prep), 'operation preparation uses typed frozen object export');
check('lowering consumes preparation factory', /requestTypeDerivationOperationPreparationFactory\.create\(/.test(lowering), 'runtime path uses the new interface-first factory');
check('legacy factory export removed', !/createRequestTypeDerivationOperationPreparation/.test(coreIndex + lowering + prep), 'bare factory function export and callsites removed');
check('collections.ts remains empty', collectionsBytes === 0, `actual size=${collectionsBytes} bytes`);
check('npm audit command registered', packageJson.scripts['audit:phase2808-domain-operated-manifest-adt'] === 'node scripts/audits/audit-phase2808-domain-operated-manifest-adt.cjs', 'phase audit is reproducible from package scripts');
process.stdout.write(`\nPhase 2808 domain-operated manifest ADT audit: ${passed}/12 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
