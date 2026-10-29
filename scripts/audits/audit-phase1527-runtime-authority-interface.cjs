const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const reasoningPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const reasoning = fs.readFileSync(reasoningPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['executor request is a closed claimed-operation handoff', /kind: 'claimed_query_operation_execution'/.test(source) && /readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>/.test(source)],
  ['executor request carries provenance-complete source evidence', /QueryOperationSemanticExecutorRequest[\s\S]*evidence: QueryOperationSemanticSourceEvidence/.test(source)],
  ['executor plan is indexed across every declared rule family', /QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*QueryOperationSemanticExecutorRequest<Rule>[\s\S]*QueryOperationSemanticProvenanceJudgmentFor<Rule>/.test(source)],
  ['runtime authority claim carries the correlated execution plan', /interface QueryOperationSemanticRuntimeAuthority[\s\S]*readonly claim: \(methodName: MethodName\) => QueryOperationSemanticRuntimeClaim/.test(source) && /QueryOperationSemanticRuntimeClaim[\s\S]*plan: QueryOperationSemanticOwnedExecutionPlanFor<Rule>/.test(source)],
  ['owned execution plan excludes not_applicable and carries provenance judgment', /QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*QueryOperationSemanticProvenanceJudgmentFor<Rule>/.test(source) && !/interface QueryOperationSemanticRuntimeAuthority[\s\S]*executors: QueryOperationSemanticExecutorTable/.test(source)],
  ['public index exports runtime authority contract types', /QueryOperationSemanticExecutorRequest[\s\S]*QueryOperationSemanticExecutorTable[\s\S]*QueryOperationSemanticRuntimeAuthority/.test(index)],
  ['reasoning remains the current implementation and has not silently claimed migration', /queryOperationRuleCatalog/.test(reasoning) && !/QueryOperationSemanticRuntimeAuthority/.test(reasoning)],
  ['scanner still delegates owned methods upstream and only falls back for unclaimed methods', /resolveQueryOperation\(/.test(scanner) && /operationDecision\.kind === 'malformed'/.test(scanner) && /Remaining legacy families are an explicit migration frontier/.test(scanner)],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
