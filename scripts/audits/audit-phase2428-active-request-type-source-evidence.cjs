'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const loweringContract = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const projectionContract = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const checks = [
  ['active manifest lowering invokes the canonical evidence inventory', /requestTypeDerivationSourceEvidenceInventory\.inventory\(input\)/.test(lowering)],
  ['inventory and legacy projection receive the same source collections', /const input = Object\.freeze\(\{ routes, resources, requests \}\)[\s\S]*?inventory\(input\)[\s\S]*?derive\(\{ \.\.\.input, interner \}\)/.test(lowering)],
  ['lowering result contract retains source evidence', /readonly sourceEvidence: readonly RequestTypeEvidenceReference\[\];/.test(loweringContract)],
  ['projection result contract retains source evidence', /readonly sourceEvidence: readonly RequestTypeEvidenceReference\[\];/.test(projectionContract)],
  ['manifest projection forwards the same source evidence', /sourceEvidence: lowering\.sourceEvidence/.test(projection)],
  ['scan CLI writes source evidence beside output artifacts', /routesync\.request-type-source-evidence\.json/.test(scan)],
  ['sync CLI writes source evidence beside output artifacts', /routesync\.request-type-source-evidence\.json/.test(sync)],
  ['no semantic foundation/relation dependency was introduced in the active evidence operation', !/semantic\/(relations|foundation)/.test(inventory)],
  ['audit does not misrepresent legacy semantic solver as proof-backed', /requestTypeDerivationProjectionPipeline\.derive/.test(lowering)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = Number(failures > 0);
