const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const reasoningPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const reasoning = fs.readFileSync(reasoningPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['authority claim consumes complete source evidence, not a detached method name', /claim: \(evidence: QueryOperationSemanticSourceEvidence\) => QueryOperationSemanticRuntimeClaim/.test(source)],
  ['owned plan carries the evidence used for ownership', /QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*readonly evidence: QueryOperationSemanticSourceEvidence/.test(source)],
  ['owned plan pre-binds evidence and contract before execution', /QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>[\s\S]*readonly execute: \(\) => QueryOperationSemanticProvenanceJudgmentFor<Rule>/.test(source)],
  ['executor table returns the same provenance judgment algebra exposed by authority', /QueryOperationSemanticExecutorTable = Readonly<[\s\S]*=> QueryOperationSemanticProvenanceJudgmentFor<Rule>/.test(source)],
  ['claimed and unclaimed remain discriminated; unclaimed has no plan', /QueryOperationSemanticRuntimeClaim =[\s\S]*kind: 'claimed'[\s\S]*plan: QueryOperationSemanticOwnedExecutionPlanFor<Rule>[\s\S]*kind: 'unclaimed'[\s\S]*unclaimed_query_operation_rule/.test(source)],
  ['semantic reasoning implementation remains unchanged and owns the rule catalog', /queryOperationRuleCatalog/.test(reasoning)],
  ['scanner remains delegated to upstream resolver; no scanner body migration in this phase', /resolveQueryOperation\(/.test(scanner)],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
