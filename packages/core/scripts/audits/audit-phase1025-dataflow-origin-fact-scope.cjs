const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const adapter = read('src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const policy = read('src/compiler/analysis/dataflow/dataFlowFactPolicyInterface.ts');
const contributor = read('src/compiler/analysis/dataflow/dataFlowConfigContributorInterface.ts');
const originStart = semantic.indexOf('export type SemanticDataflowOrigin');
const lineageStart = semantic.indexOf('export type SemanticDataflowLineage');
const originBlock = lineageStart > originStart ? semantic.slice(originStart, lineageStart) : semantic.slice(originStart);
const checks = {
  originHasNoProducerLineage: originStart >= 0 && !/readonly lineage/.test(originBlock),
  factRetainsProducerLineage: /SemanticDataflowFactLineage/.test(semantic) && /producer: SemanticDataflowLineage\['producer'\]/.test(semantic),
  adapterDoesNotAssignInputProducer: !/producer: SemanticDataflowLineage/.test(adapter) && !/lineage:\s*Object\.freeze/.test(adapter) && !/knowledge: SemanticKnowledgeDataFlow,\n  producer:/.test(adapter),
  upstreamContractUnchanged: /seed:/.test(dataflow) && /derive:/.test(dataflow) && /close:/.test(dataflow) && /reaches:/.test(dataflow),
  selectorDownstream: /DataFlowFactPolicyInterface/.test(policy) && !/DataFlowFactPolicyInterface/.test(semantic),
  contributorDownstream: /DataFlowConfigContributorInterface/.test(contributor) && !/DataFlowConfigContributorInterface/.test(semantic),
};
checks.clean = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 1025, checks }, null, 2));
process.exitCode = checks.clean ? 0 : 1;
