const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const assertions = [
  ['legacy scanner RequestTypeDeriver facade retired', !exists('packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts')],
  ['legacy scanner barrel no longer exports RequestTypeDeriver', !/RequestTypeDeriver|deriveRequestTypes/.test(read('packages/core/src/compiler/scanner/subscanners/index.ts'))],
  ['legacy group aggregator facade retired', !exists('packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts')],
  ['legacy RequestType[] solver retired from production source', !exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts')],
  ['legacy projection pipeline alias retired', !exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts')],
  ['legacy projection interface retired', !exists('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionInterface.ts')],
  ['default route manifest lowering bypass retired', !exists('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts')],
  ['default route manifest lowering interface retired', !exists('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts')],
  ['CLI scan resolves pipeline before source acquisition', read('packages/cli/src/commands/scan.ts').indexOf('requestTypeDerivationSemanticPipelineResolution.resolve') < read('packages/cli/src/commands/scan.ts').indexOf('manifestComposition.compose')],
  ['CLI sync resolves pipeline before source acquisition', read('packages/cli/src/commands/sync.ts').indexOf('requestTypeDerivationSemanticPipelineResolution.resolve') < read('packages/cli/src/commands/sync.ts').indexOf('manifestComposition.compose')],
  ['CLI scan passes resolved pipeline into active projection', /projectRouteSyncManifestForRouteManifest\(\s*requestResolutionPreflight,\s*requestTypeDerivationPipeline,?\s*\)/s.test(read('packages/cli/src/commands/scan.ts'))],
  ['CLI sync passes resolved pipeline into active projection', /projectRouteSyncManifestForRouteManifest\(\s*requestResolutionPreflight,\s*requestTypeDerivationPipeline,?\s*\)/s.test(read('packages/cli/src/commands/sync.ts'))],
  ['active projection uses authority-backed lowering', read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts').includes('createAuthorityBackedRouteManifestTypeLowering')],
  ['active projection does not import legacy solver or relation layer', !/requestTypeDerivationSolver|semantic\/relations|semantic\/foundation|subscanners/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'))],
  ['closed semantic pipeline remains canonical upstream contract', read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts').includes('RequestTypeDerivationSemanticPipelineCompositionInterface') && read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts').includes('REQUEST_TYPE_DERIVATION_LAW_IDS')],
  ['CLI remains fail-closed when production composition is absent', read('packages/cli/src/commands/scan.ts').includes('cli_upstream_composition_missing') && read('packages/cli/src/commands/sync.ts').includes('cli_upstream_composition_missing')],
];
let failures = 0;
for (const [name, passed] of assertions) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\n${assertions.length - failures}/${assertions.length} structural assertions passed\n`);
if (failures > 0) process.exitCode = 1;
