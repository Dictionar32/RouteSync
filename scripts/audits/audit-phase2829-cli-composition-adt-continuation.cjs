'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const consumer = read('packages/cli/src/index.ts');
const manifest = read('packages/cli/src/manifestScanOperationInterface.ts');
const authority = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const collections = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['composition result is a closed discriminated ADT', /kind: 'routesync_cli_upstream_composition_available'/.test(factory) && /kind: 'routesync_cli_upstream_semantic_assembly_rejected'/.test(factory)],
  ['available ADT carries domain continuation', /continueForCliComposition:[\s\S]*?RouteSyncCliUpstreamCompositionResolutionHandlers/.test(factory)],
  ['rejected ADT carries domain continuation', (factory.match(/continueForCliComposition:/g) || []).length >= 2],
  ['continuation handlers are domain-specific', /compositionAvailable:[\s\S]*?semanticAssemblyRejected:/.test(factory)],
  ['factory uses interface-first frozen operation export', /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface\s*=\s*Object\.freeze\(/.test(factory)],
  ['CLI runtime consumes ADT continuation instead of re-dispatching its kind', /return resolution\.continueForCliComposition\(/.test(consumer) && !/switch\s*\(resolution\.kind\)/.test(consumer)],
  ['rejection retains exact upstream assembly rejection', /assembly,\s*continueForCliComposition/.test(factory) && /semanticAssemblyRejected:/.test(consumer)],
  ['manifest scan operation uses explicit interface-first contract', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(manifest)],
  ['manifest authority retains explicit complete/blocked outcomes', /ManifestBuilderJudgment/.test(authority) && /controller_invocation_manifest_source_documents_blocked/.test(authority)],
  ['active route scanner consumes interface-first source context operation', /routeSourceFileContextKnowledgeOperation\.resolve\(sourceFilePath\)/.test(scanner)],
  ['upstream collections remains empty', collections === 0],
];
let failed = 0;
console.log('Phase 2829 — CLI composition ADT continuation audit');
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
  if (!pass) failed++;
}
console.log(`${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exitCode = 1;
