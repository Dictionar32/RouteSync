const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const executor = read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const adapter = read('packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/semanticDataflowRuntimeBinding.ts');
const checks = [
  ['runtime request is a closed discriminated union for evidence and no-evidence', /type SemanticDataflowEvidenceExecutionRequest[\s\S]*?kind: 'evidence_input'[\s\S]*?type SemanticDataflowNoEvidenceExecutionRequest[\s\S]*?kind: 'no_evidence'[\s\S]*?type SemanticDataflowRuntimeExecutionRequest\s*=/.test(contract)],
  ['single execute method accepts the closed request and returns a closed result union', /\(request: SemanticDataflowEvidenceExecutionRequest\): SemanticDataflowBoundaryResult/.test(contract) && /\(request: SemanticDataflowNoEvidenceExecutionRequest\): SemanticDataflowNoEvidenceResult/.test(contract) && !/readonly noEvidence:/.test(contract)],
  ['executor owns protocol dispatch and authority/admission composition', /function executeEvidenceRequest[\s\S]*?request\.input\.kind === 'no_evidence'[\s\S]*?semanticDataflowJudgmentBoundary\.admit\(semanticDataflowReasoningAuthority\.judge\(request\.input\.value\)\)/.test(executor)],
  ['no-evidence explicitly means not evaluated rather than semantic success', /semanticStatus: 'not_evaluated'[\s\S]*?protocolClosed: true/.test(contract) && /semanticStatus: 'not_evaluated'[\s\S]*?protocolClosed: true/.test(executor)],
  ['adapter constructs both request variants and scanner forwards the union through one execute interface', /kind: 'no_evidence'/.test(adapter) && /kind: 'evidence_input'/.test(adapter) && /executor\.execute\(request\)/.test(scanner) && /semanticDataflowRuntimeExecutor/.test(binding)],
  ['scanner no-evidence result is a distinct union variant, not a fabricated judgment', /kind: 'semantic_data_flow_no_evidence'[\s\S]*?semanticStatus: 'not_evaluated'[\s\S]*?protocolClosed: true/.test(scanner) && /kind: 'semantic_data_flow_judgment'[\s\S]*?evidenceStatus: 'dataflow_facts_present'[\s\S]*?closed: true/.test(scanner)],
  ['scanner does not compose authority or admission directly', !/semanticDataflowReasoningAuthority|semanticDataflowJudgmentBoundary/.test(scanner)],
  ['executor adds no second reasoning engine', !/fixedPoint|deriveFacts|inferRole|rebuildPath/.test(executor)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
