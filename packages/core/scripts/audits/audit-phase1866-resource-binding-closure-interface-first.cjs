const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('src/types/upstream/resourceModelBindingSemanticInterface.ts');
const judgment = read('src/types/upstream/laravelScannerSemanticJudgment.ts');
const authority = read('src/compiler/semantic/resourceModelBindingAuthority.ts');
const scannerContract = read('src/types/upstream/laravelResourceScannerInterface.ts');
const scanner = read('src/compiler/scanner/wiring/laravelResourceScanner.ts');
const index = read('src/index.ts');
const checks = [
  ['closure is an explicit upstream interface with state identity, transition, cycle disposition, and publication contracts', /interface ResourceModelBindingBatchClosureModelInterface[\s\S]*?readonly stateIdentity[\s\S]*?readonly transition[\s\S]*?readonly cycleDisposition[\s\S]*?readonly publication/.test(model)],
  ['closure identity is the exact canonical input subject object, not structural coincidence', /subject: 'exact-input-subject-object'[\s\S]*?equality: 'reference-identity-of-the-canonical-subject'/.test(model)],
  ['semantic judgment model owns the canonical batch closure interface', /readonly batchClosure: ResourceModelBindingBatchClosureModelInterface/.test(model) && /batchClosure: RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL/.test(model)],
  ['authority contract names the exact closure model it executes', /readonly closureModel: ResourceModelBindingBatchClosureModelInterface/.test(judgment) && /closureModel: RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL/.test(authority)],
  ['batch state equivalence correlates judgments by exact subject identity', /relationFirstOption\(right, candidate => candidate\.outcome\.subject === judgment\.outcome\.subject\)/.test(authority) && !/sameOutcome\(judgment, right\[index\]\)/.test(authority)],
  ['cycle impact is computed by subject identity rather than positional index', /judgmentForSubject\(subject, baseline\)/.test(authority) && /affectedSubjects\.some\(affected => affected === subject\)/.test(authority) && !/affectedIndexes/.test(authority)],
  ['next-state publication retrieves the judgment for the same subject object', /relationFirstOption\(next, judgment => judgment\.outcome\.subject === subject\)/.test(authority)],
  ['authority contract versions the closure correspondence', /readonly contractVersion: 4/.test(judgment) && /closureCorrespondence: 'state-transition-and-cycle-impact-use-exact-subject-identity-not-array-index'/.test(authority)],
  ['scanner only projects artifacts after the integrated closed batch judgment', /bindingAuthority\.judgeBatch/.test(scanner) && /bindingBatch\.bindings/.test(scanner) && /readonly response: LaravelResourceIntegratedResponse/.test(scannerContract)],
  ['integrated response retains the complete controller invocation scan', /readonly controllerScan: LaravelControllerScanJudgment/.test(scannerContract) && /controllerScan: input\.controllerScan/.test(scanner)],
  ['public API exports the closure interface and canonical model', /ResourceModelBindingBatchClosureModelInterface/.test(index) && /RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL/.test(index)],
  ['scanner contract declares exact-subject closure identity and version 17', /readonly contractVersion: 17/.test(scannerContract) && /closureStateIdentity: 'fixed-point-state-equivalence-is-keyed-by-exact-input-subject-object-identity-not-array-position'/.test(scannerContract) && /contractVersion: 17/.test(scanner)],
  ['no semantic foundation dependency is reintroduced', !/semantic\/foundation/.test(model + judgment + authority + scannerContract + scanner)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
process.exitCode = failed ? 1 : 0;
