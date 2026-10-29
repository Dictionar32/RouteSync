'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contracts = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const pkg = JSON.parse(read('package.json'));
const variants = [
  'controller_invocation_manifest_source_project_identity_blocked',
  'controller_invocation_manifest_source_document_identity_rejected',
  'controller_invocation_manifest_source_documents_blocked',
  'controller_invocation_manifest_source_discovery_blocked',
  'controller_invocation_manifest_inventory_rejected',
  'manifest_builder_blocked',
];
const checks = [
  ['composition result is an explicit closed ADT including upstream manifest judgment', /export type ControllerInvocationManifest\s*=/.test(contracts) && /ManifestBuilderJudgment/.test(contracts)],
  ['terminal variants are enriched with their domain operation at the producer boundary', /sourceDiscoveryBlocked: judgment => Object.freeze/.test(composition) && /sourceProjectIdentityBlocked: judgment => Object.freeze/.test(composition) && /sourceDocumentsBlocked: judgment => Object.freeze/.test(composition)],
  ['terminal actions are invoked on the manifest judgment itself', /freshManifest\.continueForDriftAudit\(\{/.test(drift)],
  ['manifest inventory rejection is preserved instead of building a manifest', /controller_invocation_manifest_inventory_rejected/.test(composition) && /manifestBuilderPreparation\.prepare/.test(composition)],
  ['source-document identity rejection cannot fall through to manifest dereference', /sourceDocumentIdentityRejected:\s*judgment\s*=>/.test(drift) && /source-document identity binding/.test(drift)],
  ['audit script is registered', pkg.scripts?.['audit:phase2834-drift-manifest-terminal-adt'] === 'node scripts/audits/audit-phase2834-drift-manifest-terminal-adt.cjs'],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2834 drift manifest terminal ADT audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (failed) process.exitCode = 1;
