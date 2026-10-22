const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const projectionPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const loweringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const executorPath = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts');
const coreIndexPath = path.join(root, 'packages/core/src/index.ts');

const composition = fs.readFileSync(compositionPath, 'utf8');
const projection = fs.readFileSync(projectionPath, 'utf8');
const lowering = fs.readFileSync(loweringPath, 'utf8');
const executor = fs.readFileSync(executorPath, 'utf8');
const coreIndex = fs.readFileSync(coreIndexPath, 'utf8');

const checks = [
  ['composition requires the canonical semantic pipeline', /createRouteManifestProjectionComposition\s*=\s*\(\s*pipeline:\s*RequestTypeDerivationSemanticPipelineInterface/.test(composition)],
  ['composition delegates to authority-backed projection', /createAuthorityBackedRouteManifestProjection\(pipeline\)/.test(composition)],
  ['authority projection delegates to authority-backed lowering', /createAuthorityBackedRouteManifestTypeLowering\(pipeline\)/.test(projection)],
  ['authority lowering prepares upstream operation before no-argument runtime execution', /operationPreparation\.prepare\(input\)[\s\S]*?createRequestTypeDerivationRuntimeExecutor\(preparedOperation\)\.execute\(\)/.test(lowering) && !/createRequestTypeDerivationRuntimeExecutor\(pipeline/.test(lowering)],
  ['non-projectable derivation is preserved as a closed result', /kind:\s*'manifest_projection_blocked'[\s\S]*?derivation:\s*result\.derivation/.test(composition)],
  ['blocked outcome has no legacy fallback branch', !/requestTypeDerivationProjectionPipeline|aggregateRequestTypeGroups|createDerivationContext/.test(composition)],
  ['composition factory is publicly exported', /createRouteManifestProjectionComposition/.test(coreIndex)],
  ['runtime executor exists as the downstream executor', /export const createRequestTypeDerivationRuntimeExecutor/.test(executor)],
];

let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
