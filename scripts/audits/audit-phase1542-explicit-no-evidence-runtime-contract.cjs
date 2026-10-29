// Compatibility entry point retained for workflows that still invoke the Phase 1542 audit name.
// Assertions follow the evolved Phase 1543 request algebra so this current-source audit does not
// report a regression merely because the separate noEvidence() method was intentionally removed.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const executor = read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts');
const adapter = read('packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/semanticDataflowRuntimeBinding.ts');
const checks = [
  ['no-evidence is a distinct non-judgment runtime outcome', /type SemanticDataflowNoEvidenceResult[\s\S]*?kind: 'semantic_dataflow_no_evidence'[\s\S]*?semanticStatus: 'not_evaluated'[\s\S]*?protocolClosed: true/.test(contract)],
  ['runtime interface accepts the closed request algebra through one execute operation', /\(request: SemanticDataflowEvidenceExecutionRequest\): SemanticDataflowBoundaryResult/.test(contract) && /\(request: SemanticDataflowNoEvidenceExecutionRequest\): SemanticDataflowNoEvidenceResult/.test(contract) && !/readonly noEvidence:/.test(contract)],
  ['executor handles no-evidence without deriving semantic facts', /function executeEvidenceRequest[\s\S]*?request\.input\.kind === 'no_evidence'[\s\S]*?semanticStatus: 'not_evaluated'[\s\S]*?protocolClosed: true/.test(executor)],
  ['empty evidence request is built by the adapter and forwarded through the runtime interface', /kind: 'no_evidence', reason: 'no_dataflow_facts'/.test(adapter) && /executor\.execute\(request\)/.test(scanner) && /semanticDataflowRuntimeExecutor/.test(binding)],
  ['legacy-facing output preserves absence as a separate variant', /kind: 'semantic_data_flow_no_evidence'[\s\S]*?semanticStatus: 'not_evaluated'[\s\S]*?protocolClosed: true/.test(scanner)],
  ['empty evidence does not manufacture a sourced canonical input', /if \(!anchor\)[\s\S]*?kind: 'no_evidence'/.test(adapter) && !/role: 'scope'|semantic-knowledge/.test(scanner)],
  ['evidence-bearing request uses the same runtime execute interface', /kind: 'evidence_input'/.test(adapter) && /executor\.execute\(request\)/.test(scanner)],
  ['scanner does not compose authority and admission directly', !/semanticDataflowReasoningAuthority|semanticDataflowJudgmentBoundary/.test(scanner)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
