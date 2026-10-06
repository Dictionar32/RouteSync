const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const policy = read('src/compiler/analysis/dataflow/dataFlowFactPolicyInterface.ts');
const contributor = read('src/compiler/analysis/dataflow/dataFlowConfigContributorInterface.ts');
const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const checks = {
  selectorExists: /DataFlowFactPolicyInterface/.test(policy),
  selectorIsFactScoped: /select: \(fact: Fact, context: Context\)/.test(policy),
  selectorFiltersFacts: /facts\.filter\(fact => policy\.select\(fact, context\)\)/.test(policy),
  contributorRemainsAnalysisOwned: /DataFlowConfigContributorInterface/.test(contributor),
  upstreamExecutionContractStable: /seed:/.test(dataflow) && /derive:/.test(dataflow) && /close:/.test(dataflow) && /reaches:/.test(dataflow),
  upstreamDoesNotOwnPolicySelector: !/DataFlowFactPolicyInterface/.test(semantic),
  graphDoesNotOwnSemanticSolver: !/createSemanticDataflowJudgment|relationFixedPoint/.test(graph),
  irDoesNotOwnSemanticSolver: !/createSemanticDataflowJudgment|relationFixedPoint/.test(ir),
};
checks.clean = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 1024, checks }, null, 2));
process.exitCode = checks.clean ? 0 : 1;
