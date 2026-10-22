const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const semantic = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const resourceContract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['semantic judgment contract advances to version 9', /readonly version: 9/.test(semantic) && /version: 9/.test(semantic)],
  ['resource scanner input and result contracts advance to version 10', /contractVersion: 10/.test(resourceContract) && /contractVersion: 10/.test(scanner)],
  ['fixed-point equality explicitly includes typed source provenance', /fixedPointEquality: 'compare-outcome-subject-candidate-and-source-provenance-with-typed-structural-equality'/.test(semantic)],
  ['source-span equality compares source file and start/end offsets', /const sameSourceSpan/.test(authority) && /left\.file\.value\.value/.test(authority) && /left\.start\.value/.test(authority) && /left\.end\.value/.test(authority)],
  ['candidate equality includes model identity and candidate evidence', /const sameCandidate/.test(authority) && /sameEvidenceSet\(left\.evidence, right\.evidence\)/.test(authority)],
  ['resolved equality includes source-correlated subject identity', /sameSubject\(leftResolved\.subject, rightResolved\.subject\)/.test(authority)],
  ['unresolved equality includes reason and source evidence provenance', /sameSourceEvidenceSet\(leftUnresolved\.evidence, rightUnresolved\.evidence\)/.test(authority) && /leftUnresolved\.reason, rightUnresolved\.reason/.test(authority)],
  ['ambiguous equality compares every candidate and its evidence', /sameCandidateSet\(leftAmbiguous\.candidates, rightAmbiguous\.candidates\)/.test(authority)],
  ['duplicate propagated evidence is normalized by typed evidence equality', /items\.findIndex\(existing => sameEvidence\(existing, item\)\)/.test(authority)],
  ['fixed-point authority does not serialize judgments to JSON', !/JSON\.stringify/.test(authority) && /sameBatch\(current, next\)/.test(authority)],
  ['scanner still forwards complete integrated controller judgment to the batch authority', /controllerScan: input\.controllerScan/.test(scanner) && /input\.bindingAuthority\.judgeBatch\(/.test(scanner) && /laravelResourceScanner\.scan/.test(pipeline)],
  ['scanner keeps projection after authority closure and avoids semantic foundation', /bindingBatch\.judgments\[index\]/.test(scanner) && !/semantic\/foundation/.test(scanner)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1849-resource-fixed-point-provenance-closure'] === 'node scripts/audits/audit-phase1849-resource-fixed-point-provenance-closure.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
