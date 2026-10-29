const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const priorAudit = read('scripts/audits/audit-phase1931-invocation-composition-provenance-closure-interface-first.cjs');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['analyzer binds one canonical source subject from the invocation judgment', /const sourceFile = judgment\.sourceFile/.test(analyzer)],
  ['knowledge projection consumes the canonical source subject', /semanticKnowledgeEvidenceAdapter\.project\(\{\s*kind: 'semantic_knowledge_evidence_projection_input',\s*evidence: block,\s*sourceFile,/s.test(analyzer)],
  ['statement payload evidence consumes the same canonical source subject', /sourcePayloadEvidenceAdapter\.collect\(\{\s*kind: 'controller_dataflow_source_payload_evidence_input',\s*sourceFile,/s.test(analyzer)],
  ['analyzer does not reconstruct source identity from a path', !/createSourceFile\(|\.value\.value/.test(analyzer)],
  ['upstream authority input documents the source-correlation boundary', /One source-correlated evidence package/.test(authorityInterface) && /readonly sourceCorrelation: ControllerDataflowSourceCorrelationInterface<Payload>/.test(authorityInterface)],
  ['authority contract version 10 closes source correlation and payload identity as one boundary value', /readonly contractVersion: 13/.test(authorityInterface) && /readonly version: 13/.test(authorityInterface) && /version: 13,/.test(authorityInterface) && /one-canonical-sourceFile-is-validated-against-the-invocation-judgment-and-knowledge-projection-through-LaravelSourceIdentitySemantics/.test(authorityInterface)],
  ['semantic model contract documents upstream source identity validation', /readonly version: 11/.test(model) && /validates-the-canonical-sourceFile-against-the-invocation-judgment-knowledge-projection-and-every-statement-payload-source-span/.test(model)],
  ['Laravel scanner boundary publishes the source-correlation rule', /readonly version: 101/.test(scanner) && /controllerDataflowSourceCorrelation/.test(scanner) && /one-source-correlation-value-crosses-the-authority-boundary/.test(scanner)],
  ['authority publishes the exact validated knowledge projection and invocation judgment', /semanticKnowledgeProjection: sourceCorrelation\.semanticKnowledgeProjection/.test(authority) && /invocationJudgment: sourceCorrelation\.invocationJudgment/.test(authority)],
  ['prior composition provenance audit remains registered', /audit:phase1931-invocation-composition-provenance-closure-interface-first/.test(priorAudit) && /readonly version: 13/.test(priorAudit)],
  ['phase 1932 audit command is registered', Boolean(packageJson.scripts['audit:phase1932-controller-dataflow-source-correlation-interface-first'])],
  ['touched analyzer and authority do not add type assertions', !/\sas\s/.test([analyzer, authority].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
