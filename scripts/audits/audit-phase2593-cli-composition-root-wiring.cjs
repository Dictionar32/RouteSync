#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('packages/cli/src/index.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifest = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const checks = [
  ['program-factory-accepts-semantic-composition', /createProgramFromSemanticComposition:\s*RouteSyncCliProgramFactoryInterface\['createFromSemanticComposition'\]/.test(index)],
  ['composition-root-uses-canonical-manifest-authority', /composeRouteSyncCliUpstream\([\s\S]*?controllerInvocationManifestCompositionAuthority,[\s\S]*?semanticComposition,[\s\S]*?\)/.test(index)],
  ['manifest-authority-is-concrete-and-exported', /export const controllerInvocationManifestCompositionAuthority\s*:\s*ControllerInvocationManifestCompositionAuthorityInterface/.test(manifest)],
  ['factory-assembles-existing-semantic-pipeline', /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(factory)],
  ['program-uses-assembled-composition', /program:\s*createProgram\(resolution\.composition\)/.test(index)],
  ['active-projection-requires-semantic-pipeline', /pipeline:\s*RequestTypeDerivationSemanticPipelineInterface/.test(projection)],
  ['lowering-does-not-fallback-to-legacy-solver', /createRequestTypeDerivationOperationPreparation\(pipeline, judgmentGroupsConsumer\)/.test(lowering) && !/requestTypeDerivationProjectionPipeline|aggregateRequestTypeGroups/.test(lowering)],
  ['assembly-rejection-preserved-as-closed-result', /case 'routesync_cli_upstream_semantic_assembly_rejected':\s*return resolution/.test(index)],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} composition-root assertions passed\n`);
if (failures > 0) process.exitCode = 1;
