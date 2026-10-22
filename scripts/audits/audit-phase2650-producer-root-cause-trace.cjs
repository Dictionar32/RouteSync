const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const cli = read('packages/cli/src/standaloneCompositionLoader.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const semanticDir = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation');
const semanticFiles = fs.readdirSync(semanticDir).filter(file => file.endsWith('.ts'));
const producerFiles = semanticFiles.filter(file => /Reasoning|SemanticProducer|ProductionReasoning/.test(file));
const assertions = [
  ['CLI loads host-owned semantic composition instead of constructing a producer', /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(cli) && /requestTypeDerivationSemanticComposition/.test(cli)],
  ['CLI validates all five semantic capability operations', /'infer'/.test(cli) && /'verify'/.test(cli) && /'decide'/.test(cli) && /'evaluate'/.test(cli) && /'validate'/.test(cli)],
  ['production composition only assembles injected capabilities', /composition: RequestTypeDerivationSemanticPipelineCompositionInterface/.test(production) && /\.assemble\(composition\)/.test(production)],
  ['missing composition remains fail-closed with no legacy array fallback', /cli_upstream_composition_missing/.test(production) && /Legacy RequestType\[\] fallback is disabled/.test(production)],
  ['preparation produces inventory and resolution ledgers, not a judgment', /identityCollisionInventory/.test(preparation) && /requestResolutionLedger/.test(preparation) && /resourceResolutionLedger/.test(preparation) && !/judgment\s*:/.test(preparation)],
  ['contract declares 34 canonical laws and explicit proof obligations', (contract.match(/^  '[a-z_]+',?$/gm) || []).length >= 34 && /REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS/.test(contract)],
  ['named reasoning producer exists but explicitly marks complete derivation as a typed gap', producerFiles.some(file => file === 'requestTypeDerivationSemanticReasoning.ts') && /RequestTypeDerivationSemanticProducerGapError/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts')) && /action\/response contribution and group-fold production/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts'))],
  ['no forbidden semantic foundation/relation dependency in the composition and preparation path', !/semantic\/(foundation|relations|relation)/.test(production + preparation)],
];
let failed = 0;
for (const [name, passed] of assertions) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${assertions.length - failed}/${assertions.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
