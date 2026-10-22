const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const requestResolution = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionInventory.ts');
const resourceResolution = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationResourceResolutionInventory.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const occurrenceVerifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const coverage = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationCoverage.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const activeDir = path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation');
const activeFiles = fs.readdirSync(activeDir).filter(file => file.endsWith('.ts'));
const reasoningProducers = activeFiles.filter(file => /requestTypeDerivation(?:SemanticReasoning|ProductionReasoning|SemanticProducer)\.ts/.test(file));
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const assertions = [
  ['reuse existing canonical law contract and obligations', contract.includes('REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS') && contract.includes('RequestTypeDerivationSemanticReasoningInterface')],
  ['reuse existing canonical source evidence inventory', inventory.includes('requestTypeDerivationSourceEvidenceInventory') && inventory.includes('canonicalRouteOccurrenceKey')],
  ['reuse existing request-resolution ledger', requestResolution.includes('requestTypeDerivationRequestResolution.resolve') && requestResolution.includes('unresolved_binding')],
  ['reuse existing resource-resolution ledger', resourceResolution.includes('requestTypeDerivationResourceResolution.resolve')],
  ['reuse existing semantic input preparation operation', preparation.includes('requestTypeDerivationSourceEvidenceInventory.inventory(input)') && preparation.includes('requestResolutionLedger') && preparation.includes('resourceResolutionLedger')],
  ['source-occurrence verifier remains a guard, not a false full verifier', occurrenceVerifier.includes('complete verifier') && occurrenceVerifier.includes('delegate.verify(inference)')],
  ['reuse existing contract coverage operation', coverage.includes('REQUEST_TYPE_DERIVATION_LAW_IDS.filter') && coverage.includes('verification_incomplete')],
  ['reuse existing pipeline assembler', assembler.includes('composition.reasoning.infer(preparedInput)') && assembler.includes('verifier.verify(inference)') && assembler.includes('composition.decision.decide')],
  ['production composition does not synthesize a legacy-array judgment', production.includes('Legacy RequestType[] fallback is disabled') && !/RequestType\[\][\s\S]*kind:\s*'derived'/.test(production)],
  ['named reasoning producer follows canonical conflict policy for duplicate identities and explicitly gaps unsupported derivation', reasoningProducers.includes('requestTypeDerivationSemanticReasoning.ts') && /conflictsFromIdentityCollisions/.test(reasoning) && /kind: 'conflict'/.test(reasoning) && /RequestTypeDerivationSemanticProducerGapError/.test(reasoning)],
  ['no forbidden foundation/relation dependency in current preparation and assembly', !/semantic\/(?:foundation|relations|relation)/.test(preparation + assembler + production)],
];
let failed = 0;
for (const [name, passed] of assertions) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${assertions.length - failed}/${assertions.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
