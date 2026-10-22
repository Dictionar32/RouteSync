const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['scan CLI uses the canonical projection entry point', /projectRouteSyncManifestForRouteManifest\(completeManifest\)/.test(read('packages/cli/src/commands/scan.ts'))],
  ['sync CLI uses the canonical projection entry point', /projectRouteSyncManifestForRouteManifest\(completeManifest\)/.test(read('packages/cli/src/commands/sync.ts'))],
  ['canonical projection still selects legacy lowering', /routeManifestTypeLowering\.project\(manifest\)/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts'))],
  ['active lowering calls legacy projection pipeline', /requestTypeDerivationProjectionPipeline\.derive\(/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts'))],
  ['legacy projection invokes raw group solver', /aggregateRequestTypeGroups\(/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts'))],
  ['authority-backed integrated manifest composition delegates through projection composition', /createRouteManifestProjectionComposition\(pipeline\)/.test(read('packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts'))],
  ['authority-backed lowering delegates to upstream operation preparation', /createRequestTypeDerivationOperationPreparation\(pipeline, judgmentGroupsConsumer\)/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'))],
  ['assembler composes reasoning, verifier, decision, and authority', /composition\.reasoning\.infer\(input\)/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts')) && /verifier\.verify\(inference\)/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts')) && /composition\.decision\.decide\(/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts')) && /composition\.authority\.evaluate\(input, candidate\)/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts'))],
  ['closed contract requires 32 law identifiers', (read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts').match(/^  '[a-z_]+',$/gm) || []).length >= 32],
  ['no concrete production reasoning implementation is present', !/readonly\s+infer\s*:\s*\(/.test(fs.readdirSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation')).filter(name => name.endsWith('.ts') && !name.includes('.test.') && !name.includes('SemanticPipelineAssembler')).map(name => read(`packages/core/src/compiler/semantic/request-type-derivation/${name}`)).join('\n'))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
