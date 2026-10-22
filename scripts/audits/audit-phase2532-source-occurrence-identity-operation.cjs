'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['existing upstream inventory interface owns route occurrence identity', /canonicalRouteOccurrenceKey:/.test(contract)],
  ['existing upstream inventory interface owns resource occurrence identity', /canonicalResourceOccurrenceKey:/.test(contract)],
  ['existing upstream inventory interface owns request occurrence identity', /canonicalRequestOccurrenceKey:/.test(contract)],
  ['inventory creates route occurrence keys through its canonical operation', /const occurrenceKey = canonicalRouteOccurrenceKey\(route\.provenance\)/.test(inventory)],
  ['inventory creates resource occurrence keys through its canonical operation', /const occurrenceKey = canonicalResourceOccurrenceKey\(resource\.source\)/.test(inventory)],
  ['inventory creates request occurrence keys through its canonical operation', /const occurrenceKey = canonicalRequestOccurrenceKey\(request\.source\)/.test(inventory)],
  ['verifier delegates route occurrence identity to upstream operation', /canonicalRouteOccurrenceKey\(source\.source\.provenance\)/.test(verifier)],
  ['verifier delegates resource occurrence identity to upstream operation', /canonicalResourceOccurrenceKey\(source\.source\.source\)/.test(verifier)],
  ['verifier delegates request occurrence identity to upstream operation', /canonicalRequestOccurrenceKey\(source\.source\.source\)/.test(verifier)],
  ['verifier no longer reconstructs occurrence keys independently', !/const coordinates =/.test(verifier) && !/route-occurrence:\$\{coordinates\(/.test(verifier)],
  ['upstream identity path avoids semantic foundation and relations imports', !/semantic\/(foundation|relations)/.test(inventory) && !/semantic\/(foundation|relations)/.test(verifier)],
  ['active manifest producer gap remains explicitly detectable', /requestTypeDerivationProjectionPipeline\.derive/.test(lowering)],
  ['phase audit is registered in package scripts', packageJson.scripts['audit:phase2532-source-occurrence-identity-operation'] === 'node scripts/audits/audit-phase2532-source-occurrence-identity-operation.cjs'],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = Number(failed.length > 0);
