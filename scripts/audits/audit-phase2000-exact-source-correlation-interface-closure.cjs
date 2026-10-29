const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['correlation input retains exact invocation judgment', /interface LaravelControllerResponseDeclarationSourceCorrelationInput[\s\S]*?readonly invocationJudgment: InvocationJudgment/.test(response)],
  ['correlation input retains declaration evidence', /interface LaravelControllerResponseDeclarationSourceCorrelationInput[\s\S]*?readonly declarationEvidence: ControllerDeclarationEvidence/.test(response)],
  ['caller cannot inject an unrelated identity receipt', !/interface LaravelControllerResponseDeclarationSourceCorrelationInput[\s\S]*?readonly identityJudgment: SourceFileIdentityRelationJudgment/.test(response)],
  ['pipeline exposes correlation projection', /interface LaravelControllerResponseSemanticPipelineInterface[\s\S]*?readonly correlateDeclarationSource:/.test(response)],
  ['correlation projection returns closed success/rejection ADT', /correlateDeclarationSource:[\s\S]*?=> LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<InvocationJudgment>/.test(response)],
  ['pipeline identity authority is explicit', /interface LaravelControllerResponseSemanticPipelineInterface[\s\S]*?readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface/.test(response)],
  ['pipeline interface retains the current integrated-response contract version', /interface LaravelControllerResponseSemanticPipelineInterface[\s\S]*?contractVersion: 17/.test(response)],
  ['pipeline contract retains the current integrated-response contract version', /interface LaravelControllerResponseSemanticPipelineContract[\s\S]*?contractVersion: 17/.test(response)],
  ['exact-source derivation rule is explicit', /sourceCorrelationInputIntegrity: 'caller-cannot-supply-an-independent-identity-judgment/.test(response)],
  ['identity remains owned by existing semantics', /readonly identityOwner: 'LaravelSourceIdentitySemanticsInterface'/.test(response)],
  ['new input publicly exported', /LaravelControllerResponseDeclarationSourceCorrelationInput/.test(index)],
  ['no relation/foundation subscanner introduced', !/operations\/(?:relation|foundation)/.test(scanner)],
  ['production scanner now wires the existing integrated-response pipeline', /responseSemanticPipeline\.judgeIntegratedResponse\(/.test(scanner) && /responseSemanticPipeline\.astProjection\.judge/.test(scanner)],
];
const failed = checks.filter(([, passed]) => !passed);
console.log(JSON.stringify({ phase: 2000, checks: checks.length, passed: checks.length - failed.length, failed: failed.map(([name]) => name) }, null, 2));
if (failed.length) process.exitCode = 1;
