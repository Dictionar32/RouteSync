const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['executor accepts semantic pipeline interface', read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts').includes('RequestTypeDerivationSemanticPipelineInterface')],
  ['authority lowering injects pipeline instead of constructing authority', read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts').includes('pipeline: RequestTypeDerivationSemanticPipelineInterface')],
  ['projection consumes closed judgment groups', read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts').includes('project: judgment => judgment.groups')],
  ['non-projectable outcomes remain explicit', read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts').includes("kind: 'derivation_not_projectable'")],
  ['authority path does not call legacy request-type solver', !read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts').includes('aggregateRequestTypeGroups')],
  ['legacy default path remains explicitly separate', read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts').includes('requestTypeDerivationProjectionPipeline.derive')],
];
const failed = checks.filter(([, ok]) => !ok);
console.log(JSON.stringify({ phase: 1587, checks: checks.length, passed: checks.length - failed.length, failed: failed.map(([name]) => name), status: failed.length ? 'failed' : 'passed_with_legacy_cutover_open' }, null, 2));
process.exitCode = failed.length ? 1 : 0;
