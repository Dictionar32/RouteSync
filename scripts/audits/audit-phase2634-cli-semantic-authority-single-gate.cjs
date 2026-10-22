const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');

for (const [name, source] of [['scan', scan], ['sync', sync]]) {
  check(`${name}-preflight-assessments-are-exported-as-diagnostics`,
    /routesync\.request-type-resolution\.json/.test(source) && /routesync\.resource-resolution\.json/.test(source));
  check(`${name}-does-not-short-circuit-on-independent-preflight-assessment`,
    !/switch\s*\(requestResolutionPreflight\.(?:assessment|resourceAssessment)\.kind\)/.test(source));
  check(`${name}-canonical-semantic-pipeline-result-is-the-projection-gate`,
    /createRouteManifestProjectionComposition\(requestTypeDerivationPipeline\)\.project\(\s*requestResolutionPreflight/.test(source) && /case 'manifest_projection_blocked'/.test(source));
}
check('preflight-is-explicitly-inventory-and-resolution-only',
  /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(preflight) &&
  /requestTypeDerivationRequestResolutionInventory\.resolve/.test(preflight) &&
  !/RequestTypeDerivationSemanticPipelineInterface/.test(preflight));
check('semantic-judgment-is-produced-through-canonical-pipeline',
  /createRequestTypeDerivationOperationPreparation\(pipeline, judgmentGroupsConsumer\)/.test(lowering) &&
  /operationPreparation\.prepare\(preflight\.input\)/.test(lowering));
check('manifest-lowering-occurs-only-after-projectable-judgment',
  /case 'projected'/.test(composition) && /lowerRouteSyncManifestToRouteManifest\(preflight\.manifest/.test(composition) && /case 'not_projectable'/.test(composition));
check('projection-path-does-not-import-foundation-or-relation',
  !/semantic\/(?:foundation|relation)/.test([scan, sync, preflight, lowering, composition].join('\n')));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2634 CLI semantic authority single gate: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
