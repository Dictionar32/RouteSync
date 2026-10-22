const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const lawBlock = contract.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[([\s\S]*?)\] as const;/);
const laws = lawBlock ? [...lawBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
check('canonical-law-inventory-is-closed', laws.length === 34 && new Set(laws).size === 34, `canonical law IDs=${laws.length}, unique=${new Set(laws).size}`);

const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
check('existing-assembler-connects-capabilities', ['composition.reasoning.infer(input)', 'verifier.verify(inference)', 'composition.decision.decide', 'authorityIntegrityGate.evaluate'].every(token => assembler.includes(token)), 'reasoning → verifier → decision → authority integrity');

const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
check('production-composition-does-not-pretend-to-produce-reasoning', composition.includes('does not ship concrete production reasoning/verifier/') && composition.includes('assembleRequestTypeDerivationProductionPipeline'), 'composition assembles injected capabilities; it is not a producer');

const cliIndex = read('packages/cli/src/index.ts');
check('executable-composition-gap-is-explicit-and-fail-closed', cliIndex.includes('loadRouteSyncStandaloneComposition(process.env[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE])') && cliIndex.includes("case 'composition_module_missing':") && cliIndex.includes("case 'composition_module_invalid':") && cliIndex.includes('createProgramFromSemanticComposition(loaded.composition)') && cliIndex.includes('process.exitCode = 1'), 'standalone entry loads and validates host composition before dispatch; missing/invalid composition exits non-zero');

const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
check('cli-factory-preserves-assembly-rejection', factory.includes("kind: 'routesync_cli_upstream_semantic_assembly_rejected'") && factory.includes('assembleRequestTypeDerivationProductionPipeline(semanticComposition)'), 'CLI factory wires the assembler and preserves typed rejection');

const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
check('scan-and-sync-consume-semantic-pipeline', scan.includes('requestTypeDerivationPipeline') && sync.includes('requestTypeDerivationPipeline'), 'both command paths require the upstream semantic pipeline');
check('no-legacy-solver-fallback-in-active-authority-projection', !read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts').includes('requestTypeDerivationSolver'), 'production composition does not import the legacy RequestType[] solver');

const report = read('packages/core/src/types/upstream/docs/PHASE2591_CLI_MANIFEST_UPSTREAM_IMPLEMENTATION_AUDIT.md');
check('report-states-unresolved-producer-and-verifier', report.includes('producer') && report.includes('34') && report.includes('does **not** claim that the producer or verifier has been implemented'), 'report distinguishes verified wiring from unresolved implementation');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
const failed = checks.filter(result => !result.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} structural assertions passed.\n`);
if (failed.length) process.exitCode = 1;
