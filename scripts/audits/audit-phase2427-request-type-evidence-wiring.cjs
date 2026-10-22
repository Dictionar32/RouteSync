'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const active = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const checks = [
  ['authority-backed lowering invokes the canonical source inventory', /sourceEvidenceInventory\.inventory\(input\)/.test(lowering)],
  ['inventory and semantic preparation receive the exact same source input', /const input = Object\.freeze\(\{ routes, resources, requests \}\)[\s\S]*?inventory\(input\)[\s\S]*?operationPreparation\.prepare\(input\)/.test(lowering)],
  ['source references retain route/resource/request ADT variants', /inventory\.routes, \.\.\.inventory\.resources, \.\.\.inventory\.requests/.test(lowering)],
  ['successful authority result carries source evidence', /kind: 'lowered'[\s\S]*?sourceEvidence/.test(lowering) && /sourceEvidence: result\.sourceEvidence/.test(projection)],
  ['non-projectable authority result also carries source evidence', /kind: 'derivation_not_projectable'[\s\S]*?sourceEvidence/.test(lowering) && /kind: 'not_projectable'[\s\S]*?sourceEvidence: result\.sourceEvidence/.test(projection)],
  ['inventory implementation does not import relation/foundation', !/semantic\/(relations|foundation)/.test(inventory)],
  ['active default lowering bypass is still explicitly detected', /requestTypeDerivationProjectionPipeline\.derive/.test(active)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = Number(failures > 0);
