'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contracts = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const barrel = read('packages/cli/src/parsers/php/index.ts');
const pkg = JSON.parse(read('package.json'));
const variants = [
  ['manifest_builder_complete', 'complete'],
  ['manifest_builder_blocked', 'manifestBlocked'],
  ['controller_invocation_manifest_inventory_rejected', 'inventoryRejected'],
  ['controller_invocation_manifest_source_discovery_blocked', 'sourceDiscoveryBlocked'],
  ['controller_invocation_manifest_source_project_identity_blocked', 'sourceProjectIdentityBlocked'],
  ['controller_invocation_manifest_source_documents_blocked', 'sourceDocumentsBlocked'],
  ['controller_invocation_manifest_source_document_identity_rejected', 'sourceDocumentIdentityRejected'],
];
const checks = [
  ['each runtime terminal carries a domain continuation operation', /export interface ControllerInvocationManifestTerminalOperationInterface[\s\S]*continueForDriftAudit/.test(contracts)],
  ['closed manifest ADT uses operation-bearing terminal variants', /export type ControllerInvocationManifest\s*=/.test(contracts) && /ControllerInvocationManifestCompleteJudgment/.test(contracts) && /ControllerInvocationManifestSourceDocumentIdentityRejectedTerminal/.test(contracts)],
  ...variants.map(([kind, handler]) => [`producer binds ${kind} directly to ${handler}`, composition.includes(`continueForDriftAudit: handlers => handlers.${handler}(judgment)`) || composition.includes(`continueForDriftAudit: handlers => handlers.${handler}(judgment)`)]),
  ['core manifest-builder outcomes are adapted at the producer boundary', /fromManifestBuilderJudgment: judgment => judgment\.kind === 'manifest_builder_complete'/.test(composition)],
  ['drift auditor invokes the operation on the terminal ADT value', /freshManifest\.continueForDriftAudit\(\{/.test(drift)],
  ['drift auditor contains no manifest terminal dispatch', !/freshManifest\.kind/.test(drift) && !/switch\s*\(/.test(drift)],
  ['composition has no declarative reasoning primitive', !/ControllerInvocationManifestCompositionReasoningContract|COMPOSITION_REASONING_CONTRACT|composition_reasoning_contract/.test(contracts + composition)],
  ['composition and operation exports are explicit in PHP barrel', /controllerInvocationManifestTerminalOperationsFactory/.test(barrel) && /ControllerInvocationManifestTerminalOperationsFactoryInterface/.test(barrel)],
  ['runtime composition contains no switch statements', !/\bswitch\s*\(/.test(composition)],
  ['audit script is registered', pkg.scripts?.['audit:phase2835-manifest-drift-domain-continuation'] === 'node scripts/audits/audit-phase2835-manifest-drift-domain-continuation.cjs'],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2835 manifest terminal-owned domain operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (failed) process.exitCode = 1;
