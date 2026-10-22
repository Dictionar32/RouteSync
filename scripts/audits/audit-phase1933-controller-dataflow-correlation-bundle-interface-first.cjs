const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const priorAudit = read('scripts/audits/audit-phase1932-controller-dataflow-source-correlation-interface-first.cjs');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream defines one typed source-correlation bundle', /export interface ControllerDataflowSourceCorrelationInterface</.test(authorityInterface) && /readonly sourceFile: SourceFile/.test(authorityInterface) && /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(authorityInterface) && /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(authorityInterface) && /readonly statementPayloads: readonly ControllerDataflowSourcePayload/.test(authorityInterface)],
  ['authority input accepts the bundle instead of independently swappable evidence fields', /readonly sourceCorrelation: ControllerDataflowSourceCorrelationInterface<Payload>/.test(authorityInterface) && !/readonly statementPayloads: readonly ControllerDataflowSourcePayload<Payload>\[\];\s*readonly invocationJudgment:/.test(authorityInterface)],
  ['scanner packages all evidence under one sourceCorrelation property', /sourceCorrelation:\s*\{\s*kind: 'controller_dataflow_source_correlation',\s*sourceFile,\s*invocationJudgment: judgment,\s*semanticKnowledgeProjection,\s*statementPayloads,/s.test(analyzer)],
  ['authority reads payload evidence through the bundle', /payloads: input\.sourceCorrelation\.statementPayloads/.test(authority)],
  ['authority resolves knowledge and integrated response from the same bundle', /const knowledge = sourceCorrelation\.semanticKnowledgeProjection\.knowledge/.test(authority) && /phpSourceInvocationPipeline: sourceCorrelation\.invocationJudgment\.response/.test(authority)],
  ['authority returns exact bundled judgment and projection', /semanticKnowledgeProjection: sourceCorrelation\.semanticKnowledgeProjection/.test(authority) && /invocationJudgment: sourceCorrelation\.invocationJudgment/.test(authority)],
  ['authority and scanner contract versions advance coherently', /readonly contractVersion: 13/.test(authorityInterface) && /readonly version: 13/.test(authorityInterface) && /contractVersion: 13,/.test(authority) && /readonly version: 101/.test(scanner) && /version: 101,/.test(scanner)],
  ['scanner contract explicitly names the bundled source-correlation boundary', /controllerDataflowSourceCorrelation/.test(scanner) && /one-source-correlation-value-crosses-the-authority-boundary/.test(scanner)],
  ['phase 1932 audit was updated for the bundled interface', /ControllerDataflowSourceCorrelationInterface/.test(authorityInterface) && /readonly version: 13/.test(priorAudit) && /version: 101/.test(priorAudit)],
  ['audit command is registered', Boolean(packageJson.scripts['audit:phase1933-controller-dataflow-correlation-bundle-interface-first'])],
  ['scanner and authority contain no newly added type assertions', !/\sas\s/.test([analyzer, authority].join('\n'))],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test([analyzer, authorityInterface, authority].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
