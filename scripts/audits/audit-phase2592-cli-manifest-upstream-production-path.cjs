const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const lawBlock = contract.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[([\s\S]*?)\] as const;/);
const laws = lawBlock ? [...lawBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
check('canonical-law-inventory-34-unique', laws.length === 34 && new Set(laws).size === 34, `laws=${laws.length}, unique=${new Set(laws).size}`);

const producerDir = 'packages/core/src/compiler/semantic/request-type-derivation';
const sourceFiles = fs.readdirSync(path.join(root, producerDir)).filter(file => file.endsWith('.ts'));
const productionComposition = read(`${producerDir}/requestTypeDerivationProductionComposition.ts`);
const hasConcreteReasoning = sourceFiles.some(file => {
  if (file === 'requestTypeDerivationProductionComposition.ts' || file.includes('test')) return false;
  const source = read(`${producerDir}/${file}`);
  return /RequestTypeDerivationSemanticReasoningInterface/.test(source)
    && /readonly\s+infer\s*:/.test(source)
    && /kind:\s*'request_type_derivation_proof'/.test(source);
});
check('missing-concrete-production-reasoning-is-confirmed', !hasConcreteReasoning, !hasConcreteReasoning ? 'CONFIRMED BLOCKER: no production implementation owns infer and constructs the source-bound proof packet' : 'Unexpected producer candidate exists; it requires semantic review before being treated as complete');

const hasConcreteCompleteVerifier = sourceFiles.some(file => {
  if (file === 'requestTypeDerivationProductionComposition.ts' || file === 'requestTypeDerivationSemanticPipelineAssembler.ts' || file.includes('test')) return false;
  const source = read(`${producerDir}/${file}`);
  return /RequestTypeDerivationProofVerificationInterface/.test(source)
    && /verifiedLaws/.test(source)
    && laws.every(law => source.includes(`'${law}'`));
});
check('missing-independent-complete-34-law-verifier-is-confirmed', !hasConcreteCompleteVerifier, !hasConcreteCompleteVerifier ? 'CONFIRMED BLOCKER: no single production verifier establishes all 34 laws; source-occurrence guard is only a partial decorator' : 'Unexpected verifier candidate exists; inspect its proof obligations before claiming closure');

const cliIndex = read('packages/cli/src/index.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const hasUncomposedDispatch = /const\s+program\s*=\s*createProgram\(\)/.test(cliIndex) || /program\.parse\(process\.argv\)/.test(cliIndex);
const hasCompositionGate = cliIndex.includes('loadRouteSyncStandaloneComposition(process.env[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE])')
  && cliIndex.includes('createProgramFromSemanticComposition(loaded.composition)')
  && cliIndex.includes('programResolution.program.parseAsync(process.argv)')
  && loader.includes("kind: 'composition_module_missing'")
  && loader.includes("kind: 'composition_module_invalid'");
check('executable-root-fails-closed-without-production-composition', !hasUncomposedDispatch && hasCompositionGate, !hasUncomposedDispatch && hasCompositionGate ? 'current standalone loader gates dispatch on a host-owned, validated composition; no host producer is bundled' : 'BLOCKED: uncomposed dispatch path or missing current composition gate detected');

const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const assembler = read(`${producerDir}/requestTypeDerivationSemanticPipelineAssembler.ts`);
check('existing-wiring-preserves-contract-boundary', factory.includes('assembleRequestTypeDerivationProductionPipeline') && assembler.includes('composition.reasoning.infer(input)') && assembler.includes('verifier.verify(inference)'), 'existing factory and assembler wire injected operations without replacing their semantics');

const sourceGuard = read(`${producerDir}/requestTypeDerivationSourceOccurrenceVerification.ts`);
check('source-occurrence-check-is-not-misrepresented-as-complete-verifier', sourceGuard.includes('does not implement the other derivation laws') && sourceGuard.includes('supplied complete verifier'), 'partial source occurrence guard delegates remaining laws to the required verifier');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'BLOCKED'} ${result.name}: ${result.detail}\n`);
const failed = checks.filter(result => !result.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} production-path root-cause assertions passed; ${failed.length} audit assertions failed. Confirmed blockers are successful findings of this audit, not claims of implementation completion.\n`);
if (failed.length) process.exitCode = 1;
