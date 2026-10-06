const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const policy = fs.readFileSync(path.join(root, 'src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts'), 'utf8');
const upstream = fs.readFileSync(path.join(root, 'src/types/dataflow/dataFlowInterface.ts'), 'utf8');
const authority = fs.readFileSync(path.join(root, 'src/types/upstream/semanticDataflowAuthority.ts'), 'utf8');
const barrel = fs.readFileSync(path.join(root, 'src/compiler/analysis/dataflow/index.ts'), 'utf8');
const coreBarrel = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');

const checks = {
  concretePolicyExists: true,
  usesFactScopedSelector: /selectDataFlowFacts\(/.test(policy),
  separatesSourceAndSinkProducerSets: /sourceProducers/.test(policy) && /sinkProducers/.test(policy),
  sourcePredicateIsPolicyDerived: /isSource: node => factContains\(contributionContext\.sourceFacts, node\)/.test(policy),
  sinkPredicateIsPolicyDerived: /isSink: node => factContains\(contributionContext\.sinkFacts, node\)/.test(policy),
  doesNotAddSemanticEdges: /isAdditionalFlowStep: \(\) => false/.test(policy),
  doesNotAddBarriers: /isBarrier: \(\) => false/.test(policy),
  authorityStillOwnsClosure: /createSemanticDataflowJudgment/.test(authority),
  upstreamContractUnchanged: /DataFlowSourceInterface[\s\S]*DataFlowStepInterface[\s\S]*DataFlowFixpointInterface[\s\S]*DataFlowQueryInterface/.test(upstream),
  analysisBarrelExport: /createSemanticDataflowAnalysisPolicy/.test(barrel),
  coreBarrelExport: /createSemanticDataflowAnalysisPolicy/.test(coreBarrel),
};
checks.clean = Object.values(checks).every(Boolean);
process.stdout.write(JSON.stringify({ phase: 1026, checks }, null, 2) + '\n');
if (!checks.clean) process.exit(1);
