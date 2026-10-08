const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const judgment = read('packages/core/src/types/upstream/semanticDataflow.ts');
const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const runtimeBoundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const runtimeComposition = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const dataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');

const checks = {
  canonicalJudgmentAuthorityExists: /createSemanticDataflowJudgment/.test(authority),
  judgmentCarriesProofContract: /reasoningContract:\s*SemanticReasoningContract/.test(judgment),
  adapterCallsUpstreamAuthority: /createSemanticDataflowJudgment\(input\)/.test(adapter),
  adapterPreservesExactProof: /reasoning:\s*state\.reasoningContract/.test(adapter),
  adapterDoesNotMintSecondProof: !/semanticReasoningContract\s*\(/.test(adapter),
  adapterUsesGenericDataFlowContract: /DataFlowInterface</.test(adapter),
  runtimeBoundaryIsDirectionalWiring: /extends UpstreamWiringInterface</.test(runtimeBoundary),
  runtimeCompositionUsesAdapter: /createSemanticDataflowDataFlowInterface\(input\)/.test(runtimeComposition),
  consumerSurfaceIsAuthorityOnly: /DataFlowConsumerInterface/.test(dataflow) && /DataFlowAuthorityInterface/.test(dataflow),
};
const result = { audit: 'phase940-upstream-dataflow-interface-wiring', topology: 'upstream judgment authority -> proof-preserving wiring adapter -> generic DataFlow contract -> authority-only consumers', checks, passed: Object.values(checks).every(Boolean) };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = result.passed ? 0 : 1;
