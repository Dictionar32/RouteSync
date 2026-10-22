const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliIndex = read('packages/cli/src/index.ts');
const coreIndex = read('packages/core/src/index.ts');
const cliContract = read('packages/cli/src/upstreamCompositionInterface.ts');
const productionComposition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const checks = [
  ['factory consumes existing upstream semantic composition interface', /RequestTypeDerivationSemanticPipelineCompositionInterface/.test(factory)],
  ['factory delegates assembly to canonical upstream assembler', /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(factory)],
  ['factory receives existing manifest authority rather than reconstructing it', /manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface/.test(factory)],
  ['assembled branch wires exact assembled pipeline into CLI composition', /requestTypeDerivationPipeline:\s*assembly\.pipeline/.test(factory)],
  ['rejected branch preserves closed assembly rejection ADT', /kind:\s*'routesync_cli_upstream_semantic_assembly_rejected'/.test(factory) && /assembly,/.test(factory)],
  ['factory does not implement semantic inference or legacy fallback', !/\.infer\(|requestTypeDerivationSolver|legacy/i.test(factory)],
  ['CLI composition contract remains manifest plus semantic pipeline', /manifestComposition/.test(cliContract) && /requestTypeDerivationPipeline/.test(cliContract)],
  ['core publicly exports semantic composition and assembly result contracts', /RequestTypeDerivationSemanticPipelineCompositionInterface/.test(coreIndex) && /RequestTypeDerivationSemanticPipelineAssemblyResult/.test(coreIndex)],
  ['CLI publicly exports the composition operation', /export \{ composeRouteSyncCliUpstream \}/.test(cliIndex)],
  ['missing production capabilities are not disguised as a complete pipeline', /does not ship concrete production reasoning\/verifier/i.test(productionComposition)],
  ['active composition factory avoids foundation relation and subscanner dependencies', !/semantic\/(?:foundation|relation)|subscanner/i.test(factory)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
process.stdout.write(`Phase 2583: ${checks.length - failures}/${checks.length} structural assertions passed. Concrete production semantic capabilities remain an explicit external prerequisite.\n`);
process.exitCode = failures ? 1 : 0;
