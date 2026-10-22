'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const ast = read('packages/core/src/types/upstream/ast.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const projectionComposition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const cliLoader = read('packages/cli/src/standaloneCompositionLoader.ts');
const cliIndex = read('packages/cli/src/index.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const upstream = read('packages/core/src/upstream.ts');
const coreIndex = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream contract owns closed AST-linked ADTs and 34 law IDs', /RequestAst, ResourceAst/.test(contract) && /export type RequestTypeDerivationJudgment =/.test(contract) && (contract.match(/^  '[a-z_]+',?$/gm) || []).length >= 34],
  ['AST definitions remain the source types for request/resource identities', /export interface RequestAst|export type RequestAst/.test(ast) && /export interface ResourceAst|export type ResourceAst/.test(ast)],
  ['inventory runtime implementation is in semantic layer and typed by upstream interface', /export const requestTypeDerivationSourceEvidenceInventory:\s*RequestTypeDerivationSourceEvidenceInventoryInterface\s*=\s*Object\.freeze/.test(inventory) && !exists('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts')],
  ['preparation composes inventory plus request/resource resolution ledgers', /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(preparation) && /requestResolutionLedger/.test(preparation) && /resourceResolutionLedger/.test(preparation)],
  ['manifest preflight converts manifest into typed AST input and invokes canonical preparation', /routeFlowsFromManifest\(manifest\)/.test(preflight) && /resourceAstsFromManifest\(manifest\)/.test(preflight) && /requestAstsFromManifest\(manifest\)/.test(preflight) && /requestTypeDerivationSemanticInputPreparation\.prepare\(input\)/.test(preflight)],
  ['reasoning producer uses requested export const name: interface pattern', /export const requestTypeDerivationSemanticReasoning:\s*RequestTypeDerivationSemanticReasoningInterface\s*=/.test(reasoning)],
  ['reasoning produces a source-bound duplicate-identity ADT and explicitly gaps unsupported full judgment closure', /conflictsFromIdentityCollisions/.test(reasoning) && /kind: 'incomplete'/.test(reasoning) && /kind: 'conflict'/.test(reasoning) && /input: preparedInput\.input/.test(reasoning) && /RequestTypeDerivationSemanticProducerGapError/.test(reasoning) && /action\/response|contribution|group-fold/.test(reasoning) && /kind: 'incomplete'/.test(reasoning)],
  ['proof verifier uses requested export const name: interface pattern, checks source collision witnesses, and leaves all 34 laws explicit', /export const requestTypeDerivationProofVerifier:\s*RequestTypeDerivationProofVerificationInterface\s*=/.test(verifier) && /requestTypeDerivationIdentityConflictLedgerMatchesInput/.test(verifier) && /verification_incomplete/.test(verifier) && /REQUEST_TYPE_DERIVATION_LAW_IDS/.test(verifier) && /missingLaws: REQUEST_TYPE_DERIVATION_LAW_IDS/.test(verifier)],
  ['assembler preserves actual flow: prepare → infer → verify → decide → authority integrity', /composition\.preparation\.prepare\(input\)/.test(assembler) && /composition\.reasoning\.infer\(preparedInput\)/.test(assembler) && /verifier\.verify\(inference\)/.test(assembler) && /composition\.decision\.decide/.test(assembler) && /authorityIntegrityGate\.evaluate/.test(assembler)],
  ['unsupported decision, authority, and integrity are explicit typed gaps, not success-shaped fallbacks', /RequestTypeDerivationSemanticProducerGapError/.test(composition) && /'decision'/.test(composition) && /'authority'/.test(composition) && /'integrity'/.test(composition)],
  ['CLI loader wires diagnostic default and external host override through same composition contract', /requestTypeDerivationSemanticComposition/.test(cliLoader) && /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(cliLoader) && /isRequestTypeDerivationSemanticPipelineComposition/.test(cliLoader)],
  ['CLI composition root binds manifest authority and assembled semantic pipeline together', /controllerInvocationManifestCompositionAuthority/.test(cliIndex) && /composeRouteSyncCliUpstream/.test(cliIndex) && /createProgramFromSemanticComposition/.test(cliIndex)],
  ['scan and sync consume the injected manifest and semantic pipeline', /manifestComposition\.compose/.test(scan) && /requestTypeDerivationPipeline/.test(scan) && /manifestComposition\.compose/.test(sync) && /requestTypeDerivationPipeline/.test(sync)],
  ['active projection path is authority-backed and does not invoke legacy RequestType[] solver', /createAuthorityBackedRouteManifestProjection\(pipeline\)/.test(projection) && /createAuthorityBackedRouteManifestProjection/.test(projectionComposition) && /operationPreparation\.prepare\(preflight\.semanticInput\)/.test(lowering) && !/requestTypeDerivationProjectionPipeline\.derive/.test(projection + projectionComposition + lowering)],
  ['public upstream/core barrels expose the composition and producer/verifier values', /requestTypeDerivationSemanticComposition/.test(upstream) && /requestTypeDerivationSemanticReasoning/.test(upstream) && /requestTypeDerivationProofVerifier/.test(upstream) && /requestTypeDerivationSemanticReasoning/.test(coreIndex) && /requestTypeDerivationProofVerifier/.test(coreIndex)],
  ['retired-path identity audits point to current semantic implementation and projection files', /compiler\/semantic\/request-type-derivation\/requestTypeDerivationSourceEvidenceInventory\.ts/.test(read('scripts/audits/audit-phase2530-route-evidence-semantic-identity.cjs')) && /compiler\/semantic\/request-type-derivation\/requestTypeDerivationSourceEvidenceInventory\.ts/.test(read('scripts/audits/audit-phase2531-route-endpoint-identity.cjs')) && !exists('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts')],
  ['audit registered in package scripts', packageJson.scripts['audit:phase2657-cli-manifest-upstream-source-path'] === 'node scripts/audits/audit-phase2657-cli-manifest-upstream-source-path.cjs'],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.stdout.write('STATUS: path wiring is traceable; complete semantic closure remains blocked by the explicitly incomplete producer, 34-law verifier, decision, authority, and integrity capabilities.\n');
process.exitCode = Number(failed.length > 0);
