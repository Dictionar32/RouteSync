const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assertions = [];
const check = (name, condition, detail) => assertions.push({ name, passed: Boolean(condition), detail });

const cliIndex = read('packages/cli/src/index.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionInterface.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const manifestAuthority = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const coreIndex = read('packages/core/src/index.ts');
const pipelineAssembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const productionComposition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const sourceInventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const semanticContract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');

check('CLI composition root accepts one upstream composition', /createProgram\s*=\s*\(composition: RouteSyncCliUpstreamCompositionInterface\)/.test(cliIndex), 'createProgram only accepts an already-composed upstream capability bundle.');
check('Executable loads diagnostic composition by default and supports host override', /loadRouteSyncStandaloneComposition\(process\.env\[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE\]\)/.test(cliIndex) && /requestTypeDerivationSemanticComposition/.test(loader) && /await programResolution\.program\.parseAsync\(process\.argv\)/.test(cliIndex), 'Without a host module, CLI traverses the real upstream composition and stops with a typed gap at the first unsupported semantic stage.');
check('Scan consumes the already-assembled pipeline and fails closed before source acquisition', scan.indexOf('requestTypeDerivationPipeline === undefined') >= 0 && scan.indexOf('requestTypeDerivationPipeline === undefined') < scan.indexOf('manifestComposition.compose') && scan.includes('createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project('), 'Composition resolution belongs to the CLI root; scan validates the injected pipeline before manifest source acquisition.');
check('Sync consumes the same already-assembled pipeline and fails closed before source acquisition', sync.indexOf('requestTypeDerivationPipeline === undefined') >= 0 && sync.indexOf('requestTypeDerivationPipeline === undefined') < sync.indexOf('manifestComposition.compose') && sync.includes('createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project('), 'Sync consumes the same injected pipeline and does not resolve semantic authority a second time.');
check('Standalone loader validates exact canonical contract and all four semantic capabilities', /contract !== requestTypeDerivationContract/.test(loader) && /isCapability\(member\(value, 'reasoning'\), contract, 'infer'\)/.test(loader) && /isCapability\(member\(value, 'verifier'\), contract, 'verify'\)/.test(loader) && /isCapability\(member\(value, 'decision'\), contract, 'decide'\)/.test(loader) && /isCapability\(authority, contract, 'evaluate'\)/.test(loader) && /isCapability\(integrity, contract, 'validate'\)/.test(loader), 'The host module is structurally checked against the exact upstream contract before assembly.');
check('Diagnostic composition fails closed at unsupported semantic stages', /requestTypeDerivationSemanticComposition/.test(loader) && /RequestTypeDerivationSemanticProducerGapError/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts')) && /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(cliIndex), 'The default route is connected but incomplete semantic stages throw typed errors instead of emitting fake proofs.');
check('CLI composition includes manifest authority and semantic pipeline', /manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface/.test(cliComposition) && /requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface/.test(cliComposition), 'The command boundary explicitly names both upstream capabilities.');
check('Composition factory delegates to canonical assembler', /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(factory), 'No local semantic judgment is manufactured by CLI factory.');
check('Manifest authority composes upstream inventory and judgment authorities', /laravelControllerInvocationSemanticJudgmentInventoryAuthority/.test(manifestAuthority) && /manifestBuilderOperationPreparation/.test(manifestAuthority), 'Manifest composition uses upstream source inventory and builder preparation authorities.');
check('Source inventory implementation uses canonical upstream identity contract', /RequestTypeDerivationSourceEvidenceInventoryInterface/.test(sourceInventory) && /canonicalRouteIdentity/.test(sourceInventory) && /canonicalResourceIdentity/.test(sourceInventory) && /canonicalRequestIdentity/.test(sourceInventory) && /canonicalRouteOccurrenceKey/.test(sourceInventory), 'The operation contract remains upstream-owned while runtime implementation is in the semantic implementation layer.');
check('Upstream barrel no longer publishes inventory runtime implementation', !/requestTypeDerivationSourceEvidenceInventory/.test(upstreamBarrel), 'The types/upstream barrel no longer exposes runtime implementation code.');
check('Semantic contract defines closed judgments and law IDs', /REQUEST_TYPE_DERIVATION_LAW_IDS/.test(semanticContract) && /kind: 'derived'/.test(semanticContract) && /kind: 'incomplete'/.test(semanticContract) && /kind: 'conflict'/.test(semanticContract), 'Closed judgment ADT and full law inventory are declared upstream.');
check('Assembler prepares source input, preserves the inference envelope, and gates authority with integrity', /composition\.preparation\.prepare\(input\)/.test(pipelineAssembler) && /composition\.reasoning\.infer\(preparedInput\)/.test(pipelineAssembler) && /verifier\.verify\(inference\)/.test(pipelineAssembler) && /composition\.decision\.decide/.test(pipelineAssembler) && /authorityIntegrityGate\.evaluate\(input, candidate, verification\)/.test(pipelineAssembler) && !/composition\.authority\.evaluate\(input, candidate\)/.test(pipelineAssembler), 'The assembler wires existing capabilities in order; integrity gates authority evaluation. This wiring does not imply those capabilities have a production implementation.');
check('Active projection consumes pipeline and closed judgment', /createRequestTypeDerivationOperationPreparation\(pipeline, judgmentGroupsConsumer\)/.test(projection) && /pipeline\.derive\(input\)/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts')), 'Projection is downstream of authority-backed judgment.');
check('Legacy RequestType[] solver bypass has been retired', !fs.existsSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts')), 'The bare RequestType[] path is removed rather than adapted into a false verified judgment.');
check('Production-complete composition remains absent while diagnostic reasoning/verifier are wired', !/export const requestTypeDerivationSemanticPipelineComposition\s*=/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts')) && /requestTypeDerivationSemanticReasoning/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts')) && /requestTypeDerivationProofVerifier/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts')), 'Diagnostic producer/verifier wiring exists; full derived proof, decision, authority, and integrity remain unimplemented.');
check('No foundation/relation/subscanner imported by the new composition factory', !/semantic\/foundation|semantic\/relations|operations/.test(factory), 'The factory stays at the interface-composition boundary.');

for (const assertion of assertions) {
  process.stdout.write(`${assertion.passed ? 'PASS' : 'FAIL'} ${assertion.name}\n  ${assertion.detail}\n`);
}
const passed = assertions.filter(assertion => assertion.passed).length;
process.stdout.write(`\nStructural trace: ${passed}/${assertions.length} assertions passed.\n`);
process.stdout.write('REMAINING BLOCKER: the default diagnostic composition reaches the upstream producer/verifier path; duplicate canonical identities produce conflict judgments with source receipts and partial verification, but complete derived proof production, all 34 verifier laws, decision, authority, and integrity remain blocked.\n');
if (passed !== assertions.length) process.exitCode = 1;
