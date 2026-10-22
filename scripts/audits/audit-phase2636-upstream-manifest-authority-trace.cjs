const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const producer = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const cli = read('packages/cli/src/index.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');

const lawBlock = contract.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[([\s\S]*?)\] as const;/);
const laws = lawBlock ? [...lawBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
check('upstream-contract-owns-closed-unique-law-inventory', laws.length === 34 && new Set(laws).size === 34, `laws=${laws.length}; unique=${new Set(laws).size}`);
check('existing-interface-is-the-source-of-truth', ['RequestTypeDerivationSemanticReasoningInterface', 'RequestTypeDerivationProofVerificationInterface', 'RequestTypeDerivationSemanticDecisionInterface', 'RequestTypeDerivationSemanticAuthorityInterface', 'RequestTypeDerivationSemanticAuthorityIntegrityInterface', 'RequestTypeDerivationSemanticPipelineCompositionInterface'].every(token => contract.includes(`interface ${token}`)), 'reuse existing upstream contracts; no parallel interface is required');
check('assembler-only-wires-injected-operations', ['composition.reasoning.infer(preparedInput)', 'verifier.verify(inference)', 'composition.decision.decide', 'authorityIntegrityGate.evaluate'].every(token => assembler.includes(token)), 'reasoning → verifier → decision → integrity/authority');
check('production-kernel-gap-is-explicit-not-hidden', producer.includes('does not ship concrete production reasoning/verifier/') && producer.includes('fails closed'), 'the production factory is an assembler, not a semantic producer');
check('inventory-is-not-misrepresented-as-judgment', inventory.includes('inventory:') && !/deriveJudgment|semanticJudgment|RequestTypeDerivationJudgment/.test(inventory), 'inventory produces source identity/evidence keys, not semantic judgment');
check('source-occurrence-verifier-is-not-misrepresented-as-complete', /delegate|remaining|injected|innerVerifier/.test(verifier), 'source-occurrence checks are a guard around a broader verifier');
check('host-composition-is-validated-before-cli-dispatch', cli.includes('loadRouteSyncStandaloneComposition(process.env[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE])') && cli.includes('routeSyncCliProgramFactory.createFromSemanticComposition(loaded.composition)') && loader.includes('isRequestTypeDerivationSemanticPipelineComposition') && cli.includes("case 'composition_module_missing'"), 'missing/invalid host composition is rejected before command dispatch');
check('manifest-preflight-remains-evidence-only', preflight.includes('requestTypeDerivationSemanticInputPreparation.prepare(input)') && preparation.includes('requestTypeDerivationSourceEvidenceInventory.inventory(input)') && !preparation.includes('RequestTypeDerivationSemanticPipelineInterface'), 'manifest adapter delegates evidence preparation to semantic owner without claiming judgment authority');
check('scan-and-sync-use-the-same-single-projection-gate', ['scan', 'sync'].every(name => {
  const source = name === 'scan' ? scan : sync;
  return /routeManifestProjectionCompositionFactory\.create\(requestTypeDerivationPipeline\)\.project\(\s*requestResolutionPreflight/.test(source) && source.includes("case 'manifest_projection_blocked'");
}), 'manifest is projected only after the canonical semantic pipeline result');
check('projection-path-does-not-import-forbidden-semantic-modules', !/semantic\/(?:foundation|relation)/.test([cli, factory, loader, scan, sync, projection, preflight].join('\n')), 'no foundation/relation dependency on the active CLI-manifest path');
check('no-legacy-requesttype-array-solver-is-used-as-authority', !producer.includes('requestTypeDerivationSolver') && !factory.includes('requestTypeDerivationSolver'), 'no legacy solver fallback in production composition');

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}\n`);
const failed = checks.filter(item => !item.passed);
process.stdout.write(`\nPhase 2636 upstream manifest authority trace: ${checks.length - failed.length}/${checks.length} assertions passed.\n`);
process.stdout.write('SEMANTIC_KERNEL_STATUS: MISSING — structural wiring is not proof that production reasoning/verifier exists.\n');
if (failed.length) process.exitCode = 1;
