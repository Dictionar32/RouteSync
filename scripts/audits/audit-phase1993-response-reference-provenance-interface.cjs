const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const exportPath = path.join(root, 'packages/core/src/index.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const publicExports = fs.readFileSync(exportPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['descriptor response is named candidate, not parser-observed return', /kind: 'controller_action_response_reference_candidate'/.test(response) && !/kind: 'observed_controller_response_reference'/.test(response)],
  ['candidate carries explicit descriptor origin', /origin: 'controller-action-descriptor-response-type'/.test(response)],
  ['candidate retains source file, source span, and response reference', /kind: 'controller_action_response_reference_candidate'[\s\S]*?sourceFile: SourceFile[\s\S]*?source: SourceSpan[\s\S]*?response: ResponseReference/.test(response)],
  ['source-indexed evidence shape admits candidate without widening source identity', /Extract<LaravelControllerResponseSemanticEvidence, \{ readonly kind: 'controller_action_response_reference_candidate' \}>/.test(response)],
  ['producer observation names the candidate honestly', /kind: 'controller_method_response_reference_candidate'[\s\S]*?evidence: LaravelControllerResponseReferenceCandidateEvidence/.test(response)],
  ['response-absent observation remains explicit', /kind: 'controller_method_response_absent'[\s\S]*?kind: 'response_absent'/.test(response)],
  ['producer contract prevents candidate promotion to direct PHP return proof', /presentResponseRule:[\s\S]*not-direct-proof-of-a-PHP-return-expression/.test(response)],
  ['source binding is explicitly limited to source-file identity', /descriptorCandidateBoundary: 'source-identity-binding-proves-source-file-identity-only/.test(response)],
  ['producer contract version is incremented', /interface LaravelControllerResponseEvidenceProductionInterface[\s\S]*?contractVersion: 2/.test(response) && /interface LaravelControllerResponseEvidenceProductionContract[\s\S]*?contractVersion: 2/.test(response)],
  ['response semantic judgment contract version is incremented', /interface LaravelControllerResponseSemanticJudgmentContract[\s\S]*?contractVersion: 5/.test(response)],
  ['candidate evidence type is exported publicly', /LaravelControllerResponseReferenceCandidateEvidence/.test(publicExports) && !/LaravelControllerObservedResponseEvidence/.test(publicExports)],
  ['scanner trace confirms descriptor-derived response construction remains visible', /const response = \{ kind: 'response_present' as const, response: \{ kind: 'response_reference' as const, name: result\.descriptor\.response\.responseTypeName\(\) \} \}/.test(scanner)],
  ['no response producer runtime was added in scanner wiring', !/responseEvidenceProduction\.produce/.test(scanner) && /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner)],
  ['no relation/foundation response subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/response/relations')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/response/foundation'))],
];
const failures = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length) process.exitCode = 1;
