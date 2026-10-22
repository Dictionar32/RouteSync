const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const cliIndex = read('packages/cli/src/index.ts');
const compositionContract = read('packages/cli/src/upstreamCompositionInterface.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const productionComposition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const manifestComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const checks = [
  ['CLI composition contract requires both manifest authority and semantic pipeline', /readonly manifestComposition:\s*ControllerInvocationManifestCompositionAuthorityInterface/.test(compositionContract) && /readonly requestTypeDerivationPipeline:\s*RequestTypeDerivationSemanticPipelineInterface/.test(compositionContract)],
  ['scan resolves semantic pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined/.test(scan) && scan.indexOf('const pipelineResolution') < scan.indexOf('const sourceProject =')],
  ['sync resolves semantic pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined/.test(sync) && sync.indexOf('const pipelineResolution') < sync.indexOf('const sourceProject =')],
  ['missing CLI composition has an explicit closed ADT outcome', /kind:\s*'cli_upstream_composition_missing'/.test(productionComposition) && /reason:\s*'cli_upstream_composition_missing'/.test(productionComposition)],
  ['manifest composition has a concrete canonical dependency assembly', /export const controllerInvocationManifestCompositionAuthority/.test(manifestComposition) && /manifestBuilderPreparation:\s*manifestBuilderOperationPreparation/.test(manifestComposition)],
  ['semantic assembler consumes injected capabilities instead of inventing them', /assemblePipeline\(composition\)/.test(assembler) && /composition\.reasoning/.test(assembler) && /composition\.verifier/.test(assembler) && /composition\.decision/.test(assembler) && /composition\.authority/.test(assembler)],
  ['CLI executable invokes createProgram without a production composition', /const program = createProgram\(\)/.test(cliIndex)],
  ['production composition explicitly documents missing concrete semantic capabilities', /does not ship concrete production reasoning\/verifier/i.test(productionComposition)],
  ['scan and sync reject missing manifest authority rather than fallback', /if \(manifestComposition === undefined\)/.test(scan) && /if \(manifestComposition === undefined\)/.test(sync) && !/requestTypeDerivationSolver/.test(scan + sync)],
  ['active CLI path does not import semantic foundation or relation', !/semantic\/(?:foundation|relation)/.test(scan + sync + cliIndex + compositionContract)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
const concreteProducerFiles = [];
for (const directory of [path.join(root, 'packages/core/src'), path.join(root, 'packages/cli/src')]) {
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        const text = fs.readFileSync(full, 'utf8');
        if (/RequestTypeDerivationSemanticPipelineInterface\s*=\s*Object\.freeze/.test(text) || /implements\s+RequestTypeDerivationSemanticPipelineInterface/.test(text)) concreteProducerFiles.push(path.relative(root, full));
      }
    }
  };
  visit(directory);
}
const producerExists = concreteProducerFiles.length > 0;
process.stdout.write(`${producerExists ? 'PASS' : 'BLOCKER'} concrete production RequestType semantic pipeline producer ${producerExists ? concreteProducerFiles.join(', ') : 'not found in packages/core/src or packages/cli/src'}\n`);
process.stdout.write(`Phase 2582: ${checks.length - failures}/${checks.length} structural assertions passed; production semantic pipeline: ${producerExists ? 'found' : 'MISSING — CLI scan/sync correctly fail closed'}.\n`);
process.exitCode = failures ? 1 : 0;
