const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const reasoningPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const reasoning = fs.readFileSync(reasoningPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const names = ['QueryOperationSemanticSourceEvidence', 'QueryOperationSemanticProvenanceJudgmentFor', 'QueryOperationSemanticProvenanceJudgment', 'QueryOperationSemanticOwnedExecutionPlanFor', 'QueryOperationSemanticOwnedExecutionPlan', 'QueryOperationSemanticRuntimeClaim', 'QueryOperationSemanticProvenanceJudgment'];
const checks = [
  ['rule outcome contract includes undetermined proof state', /outcomes: readonly \['resolved', 'malformed', 'undetermined'\]/.test(source) && /declaration.outcomes.length !== 3[\s\S]*declaration.outcomes\[2\] !== 'undetermined'/.test(source)],
  ['source evidence binds payload and source span', /QueryOperationSemanticSourceEvidence[\s\S]*kind: 'source_query_operation_evidence'[\s\S]*span: SourceSpan[\s\S]*operation: QueryOperationEvidence/.test(source)],
  ['provenance judgment is family-indexed', /QueryOperationSemanticProvenanceJudgmentFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*evidence: QueryOperationSemanticSourceEvidence[\s\S]*QueryOperationSemanticRuleDeclarationFor<Rule>[\s\S]*QueryOperationSemanticSatisfiedObligationLedgerFor<Rule>/.test(source)],
  ['owned execution plan binds rule, contract, and executor output family', /QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*rule: Rule[\s\S]*evidence: QueryOperationSemanticSourceEvidence[\s\S]*contract: QueryOperationSemanticRuleDeclarationFor<Rule>[\s\S]*execute: \(\) => QueryOperationSemanticProvenanceJudgmentFor<Rule>/.test(source)],
  ['runtime claim carries plan only for claimed family', /QueryOperationSemanticRuntimeClaim[\s\S]*kind: 'claimed'[\s\S]*rule: Rule[\s\S]*plan: QueryOperationSemanticOwnedExecutionPlanFor<Rule>[\s\S]*kind: 'unclaimed'/.test(source)],
  ['runtime authority no longer exposes a detached executor table', /interface QueryOperationSemanticRuntimeAuthority[\s\S]*claim: \(evidence: QueryOperationSemanticSourceEvidence\) => QueryOperationSemanticRuntimeClaim/.test(source) && !/interface QueryOperationSemanticRuntimeAuthority[\s\S]*executors: QueryOperationSemanticExecutorTable/.test(source)],
  ['new contract types exported publicly', names.every(name => index.includes(name))],
  ['reasoning implementation remains unmigrated', /queryOperationRuleCatalog/.test(reasoning) && !/QueryOperationSemanticRuntimeAuthority/.test(reasoning)],
  ['scanner remains at explicit migration frontier', /resolveQueryOperation\(/.test(scanner) && /Remaining legacy families are an explicit migration frontier/.test(scanner)],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
