const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const typesPath = path.join(root, 'packages/core/src/types/upstream/sourceScanJudgment.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const collectionPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const types = fs.readFileSync(typesPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const collectionSize = fs.statSync(collectionPath).size;
const checks = [
  ['source scan complete contract declared', /export interface SourceScanComplete<Payload>/.test(types)],
  ['source scan blocked contract declared', /export interface SourceScanBlocked<PartialPayload>/.test(types)],
  ['runtime operation binds input and both payload types', /export interface SourceScanRuntimeOperationInterface<Input, CompletePayload, PartialPayload = never>/.test(types) && /readonly scan: \(input: Input\) => Promise<SourceScanJudgment<CompletePayload, PartialPayload>>/.test(types)],
  ['complete and blocked variants form an ADT', /export type SourceScanJudgment<CompletePayload, PartialPayload = never>\s*=\s*\| SourceScanComplete<CompletePayload>\s*\| SourceScanBlocked<PartialPayload>/.test(types)],
  ['block reason is a closed tagged union', /export type SourceScanBlockReason\s*=/.test(types) && /source_category_not_scanned/.test(types) && /source_project_identity_mismatch/.test(types) && /scanner_dependency_blocked/.test(types)],
  ['completion is bound to project, category and stage', /readonly sourceProject: SourceProjectIdentity;[\s\S]*readonly category: SourceCategory;[\s\S]*readonly stage: SourceScanStage;/.test(types)],
  ['partial evidence presence and absence are explicit variants', /source_scan_partial_payload/.test(types) && /source_scan_no_partial_payload/.test(types)],
  ['completion proof uses named ADTs instead of primitive flags or array sentinels', /SourceScanInventoryClosureWitness/.test(types) && /SourceScanProjectIdentityBindingWitness/.test(types) && !/inventoryClosed: true|sourceIdentityBound: true|readonly unresolvedRequiredInputs: readonly \[\]/.test(types)],
  ['payload contract does not encode generic collection storage', /readonly payload: Payload/.test(types) && !/readonly items: readonly .*\[\]/.test(types)],
  ['upstream barrel exports the contract', /export \* from '\.\/sourceScanJudgment';/.test(barrel)],
  ['collections file remains empty', collectionSize === 0],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
