const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const routeAnalysis = fs.readFileSync(path.join(root, 'src/compiler/analysis/routeSyncDataflowAnalysis.ts'), 'utf8');
const policy = fs.readFileSync(path.join(root, 'src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts'), 'utf8');
const upstream = fs.readFileSync(path.join(root, 'src/types/dataflow/dataFlowInterface.ts'), 'utf8');
const semantic = fs.readFileSync(path.join(root, 'src/types/upstream/semanticDataflowInterface.ts'), 'utf8');
const graph = fs.readFileSync(path.join(root, 'src/graph/ServiceGraphBuilder.ts'), 'utf8');
const ir = fs.readFileSync(path.join(root, 'src/compiler/ir/SemanticDataflowIRProjection.ts'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'src/types/upstream/semanticDataflowManifestSurface.ts'), 'utf8');

const checks = {
  productionPolicyConsumerExists: /analyzeRouteSyncManifestDataflowWithPolicy/.test(routeAnalysis),
  consumerCreatesPolicy: /createSemanticDataflowAnalysisPolicy\(result\.analysis\.interface, context\)/.test(routeAnalysis),
  callerSuppliesPolicyContext: /context: SemanticDataflowFactPolicyContext/.test(routeAnalysis),
  policyUsesFactScopedLineage: /selectDataFlowFacts\(dataflow\.judgment\.facts/.test(policy) && /lineage/.test(policy),
  configUsesContributorComposition: /composeDataFlowConfigContributors/.test(policy),
  noSemanticEdgeCreation: /isAdditionalFlowStep: \(\) => false/.test(policy),
  noPolicyInUpstreamExecutionContract: !/isSource|isSink|isBarrier|isAdditionalFlowStep/.test(upstream),
  semanticInterfaceStillExecutionOnly: /extends DataFlowInterface/.test(semantic),
  manifestIsSeedOnly: /readonly dataflowInputs/.test(manifest) && !/readonly (closure|paths|derivations)/.test(manifest),
  graphDoesNotSolveDataflow: !/reaches\(|createSemanticDataflowJudgment/.test(graph),
  irConsumesJudgment: /dataflow\.judgment\.closure/.test(ir) && !/createSemanticDataflowJudgment/.test(ir),
};
checks.clean = Object.values(checks).every(Boolean);
process.stdout.write(JSON.stringify({ phase: 1027, checks }, null, 2) + '\n');
if (!checks.clean) process.exit(1);
