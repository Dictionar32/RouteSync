'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contracts = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const phpBarrel = read('packages/cli/src/parsers/php/index.ts');
const cliBarrel = read('packages/cli/src/index.ts');
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
  ['composition reasoning primitive removed from contract and runtime', !/ControllerInvocationManifestCompositionReasoningContract|COMPOSITION_REASONING_CONTRACT|composition_reasoning_contract/.test(contracts + composition)],
  ['each ADT terminal declares continueForDriftAudit as a domain operation', /ControllerInvocationManifestTerminalOperationInterface[\s\S]*continueForDriftAudit/.test(contracts)],
  ['all seven variants are represented by operation-bearing ADT arms', variants.every(([kind]) => contracts.includes(kind) || (kind.startsWith('manifest_builder_') && contracts.includes(kind)))],
  ...variants.map(([kind, handler]) => [`producer binds ${kind} to its named domain action`, composition.includes(`continueForDriftAudit: handlers => handlers.${handler}(judgment)`)]),
  ['core builder judgment conversion occurs at the producer boundary', /fromManifestBuilderJudgment: judgment => judgment\.kind === 'manifest_builder_complete'/.test(composition)],
  ['drift auditor invokes the operation on the result itself', /freshManifest\.continueForDriftAudit\(\{/.test(drift)],
  ['drift auditor no longer performs terminal dispatch', !/freshManifest\.kind/.test(drift) && !/switch\s*\(/.test(drift)],
  ['no central continuation dispatcher remains in composition', !/controllerInvocationManifestDriftAuditContinuation/.test(composition)],
  ['runtime operation and its contracts are exported through PHP and CLI barrels', /controllerInvocationManifestTerminalOperationsFactory/.test(phpBarrel) && /ControllerInvocationManifestTerminalOperationsFactoryInterface/.test(phpBarrel) && /controllerInvocationManifestTerminalOperationsFactory/.test(cliBarrel)],
  ['composition runtime has no switch statements', !/\bswitch\s*\(/.test(composition)],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit script is registered', pkg.scripts?.['audit:phase2837-upstream-manifest-terminal-ownership'] === 'node scripts/audits/audit-phase2837-upstream-manifest-terminal-ownership.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2837 upstream manifest terminal ownership audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build, complete test suite, or CLI end-to-end run.');
if (failed) process.exitCode = 1;
