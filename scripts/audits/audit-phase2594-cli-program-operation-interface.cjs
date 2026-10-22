#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('packages/cli/src/index.ts');
const core = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const checks = [
  ['operation-interface-declares-semantic-composition-input', /export interface RouteSyncCliProgramFactoryInterface[\s\S]*?createFromSemanticComposition:[\s\S]*?RequestTypeDerivationSemanticPipelineCompositionInterface/.test(index)],
  ['operation-export-is-explicitly-typed-by-interface', /export const createProgramFromSemanticComposition:\s*RouteSyncCliProgramFactoryInterface\['createFromSemanticComposition'\]/.test(index)],
  ['named-operation-bundle-is-interface-typed', /export const routeSyncCliProgramFactory:\s*RouteSyncCliProgramFactoryInterface\s*=/.test(index)],
  ['operation-uses-canonical-manifest-authority', /composeRouteSyncCliUpstream\([\s\S]*?controllerInvocationManifestCompositionAuthority,[\s\S]*?semanticComposition/.test(index)],
  ['assembly-rejection-remains-closed', /case 'routesync_cli_upstream_semantic_assembly_rejected':\s*return resolution/.test(index)],
  ['factory-uses-existing-upstream-assembler', /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(factory)],
  ['canonical-law-inventory-has-34-unique-identifiers', (() => { const match = core.match(/REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[([\s\S]*?)\] as const/); if (!match) return false; const laws = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1]); return laws.length === 34 && new Set(laws).size === 34; })()],
  ['standalone-root-gap-is-not-misrepresented-as-fixed', !/const program = createProgram\(\);/.test(index) && /standalone executable still has no concrete semantic capability bundle/.test(index) && /cli_upstream_composition_missing/.test(index)],
];
let failures = 0;
for (const [name, pass] of checks) { process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`); if (!pass) failures += 1; }
process.stdout.write(`\n${checks.length - failures}/${checks.length} CLI operation-interface assertions passed\n`);
if (failures) process.exitCode = 1;
