const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const judgment = read('src/types/upstream/laravelScannerSemanticJudgment.ts');
const model = read('src/types/upstream/resourceModelBindingSemanticInterface.ts');
const contract = read('src/types/upstream/laravelResourceScannerInterface.ts');
const scanner = read('src/compiler/scanner/wiring/laravelResourceScanner.ts');
const authority = read('src/compiler/semantic/resourceModelBindingAuthority.ts');
const controller = read('src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['upstream batch contract exposes subject-judgment pairs instead of detached judgment arrays', /interface ResourceModelBindingSubjectJudgment[\s\S]*?readonly subject: ResourceModelBindingSubject;[\s\S]*?readonly judgment: ResourceModelBindingJudgment;/.test(judgment) && /readonly bindings: readonly ResourceModelBindingSubjectJudgment\[\]/.test(judgment) && !/interface ResourceModelBindingBatchJudgment[\s\S]*?readonly judgments:/.test(judgment)],
  ['authority contract makes subject correspondence an explicit closed responsibility', /readonly contractVersion: 4;[\s\S]*?readonly judgmentCorrespondence: 'each_binding_retains_exact_input_subject_and_its_closed_judgment'/.test(judgment) && /judgmentCorrespondence: 'each_binding_retains_exact_input_subject_and_its_closed_judgment'/.test(authority)],
  ['semantic model declares identity-based correspondence and invocation-response retention', /readonly equality: 'reference-identity-of-the-canonical-subject'/.test(model) && /readonly correspondence: 'exact-subject-object-and-judgment-pair'/.test(model) && /readonly invocationJudgment: 'retain_exact_controller_artifact_integrated_invocation_response_without_reconstruction'/.test(model)],
  ['scanner correlates by exact subject identity rather than batch index', /relationFirstOption\(bindingBatch\.bindings, binding => binding\.subject === subjectEntry\.subject\)/.test(scanner) && !/bindingBatch\.judgments\[index\]/.test(scanner)],
  ['authority returns the exact subject attached to each semantic judgment', /subject: judgment\.outcome\.subject/.test(authority) && /bindings: Object\.freeze\(judgments\.map/.test(authority)],
  ['resource integrated response contract closes decisions before AST projection', /readonly semanticDecisionOwnership: 'binding-outcome-and-fixed-point-closure-are-complete-before-resource-ast-projection'/.test(contract)],
  ['resource scan judgment publishes one integrated response value rather than detached sidecars', /interface LaravelResourceIntegratedResponse[\s\S]*?readonly controllerScan: LaravelControllerScanJudgment;[\s\S]*?readonly bindingClosure: ResourceModelBindingBatchClosure;[\s\s\S]*?readonly artifacts: LaravelResourceScanArtifactSequence/.test(contract) && /readonly response: LaravelResourceIntegratedResponse/.test(contract) && /resourceScan\.response\.artifacts\.items/.test(read('src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['Laravel controller scan preserves source-correlated invocation integrated judgment', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controller) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['resource scanner and semantic model contracts are versioned for the stronger shape', /readonly contractVersion: 17/.test(contract) && /readonly contractVersion: 5/.test(model) && /contractVersion: 17/.test(scanner)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
process.exitCode = failed ? 1 : 0;
