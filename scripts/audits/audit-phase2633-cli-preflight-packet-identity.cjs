const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const projectionInterface = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');
const projectionAuthority = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');

check('preflight-contract-binds-manifest-input-inventory-and-resolution-ledgers',
  /interface RouteManifestRequestResolutionPreflight/.test(projectionInterface) &&
  /readonly manifest: RouteSyncManifest/.test(projectionInterface) &&
  /readonly input: RequestTypeDerivationInput/.test(projectionInterface) &&
  /readonly sourceEvidence: readonly RequestTypeEvidenceReference\[\]/.test(projectionInterface) &&
  /readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt\[\]/.test(projectionInterface));
check('authority-projection-consumes-the-preflight-contract',
  /project: \(preflight: RouteManifestRequestResolutionPreflight\)/.test(projectionAuthority) &&
  /lowering\.project\(preflight\)/.test(projectionAuthority));
check('composition-accepts-the-same-preflight-packet',
  /project: \(\s*preflight: RouteManifestRequestResolutionPreflight,/.test(composition) &&
  /projection\.project\(preflight\)/.test(composition));
check('lowering-uses-preflight-bound-input-and-does-not-rebuild-source-evidence',
  /createRequestTypeDerivationOperationPreparation/.test(lowering) &&
  /preflight\.input/.test(lowering) &&
  /preflight\.sourceEvidence/.test(lowering) &&
  /preflight\.requestResolutionLedger/.test(lowering));
for (const [name, source] of [['scan', scan], ['sync', sync]]) {
  check(`${name}-evaluates-preflight-before-projection`, /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(source) && /createRouteManifestProjectionComposition\(requestTypeDerivationPipeline\)\.project\(\s*requestResolutionPreflight/.test(source));
  check(`${name}-does-not-pass-manifest-in-place-of-preflight`, !/createRouteManifestProjectionComposition\(requestTypeDerivationPipeline\)\.project\(\s*completeManifest/.test(source));
}
check('composition-lowers-the-manifest-bound-to-the-preflight-packet',
  /lowerRouteSyncManifestToRouteManifest\(preflight\.manifest/.test(composition));
check('projection-path-remains-independent-of-foundation-and-relation',
  !/semantic\/(foundation|relation)/.test([projectionInterface, projectionAuthority, composition, scan, sync, lowering].join('\n')));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2633 CLI preflight packet identity: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
