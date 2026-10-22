const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const upstream = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const checks = [
  ['scanner boundary is a typed domain contract, not scanner implementation logic', /export interface InvocationSemanticScannerBoundaryContract/.test(pipeline) && /readonly forbiddenResponsibilities: readonly \[/.test(pipeline)],
  ['scanner input ownership remains source-derived and identity-preserving', /inputOwnership: 'scanner-supplies-source-derived-knowledge-and-requested-invocation-identity'/.test(pipeline) && /inputPreparation: 'preserve-source-evidence-and-identity-without-resolving-semantic-meaning'/.test(pipeline)],
  ['single invocation and whole-knowledge aggregate operations are explicitly distinct', /readonly singleInvocation:/.test(pipeline) && /readonly wholeKnowledge:/.test(pipeline) && /readonly batchMeaning: 'one-independent-judgment-per-input-in-input-order-not-an-aggregate-knowledge-analysis'/.test(pipeline)],
  ['scanner semantic reasoning and fallback are forbidden by the contract', /'target-resolution'/.test(pipeline) && /'argument-binding'/.test(pipeline) && /'semantic-fallback-or-reclassification'/.test(pipeline)],
  ['scanner must preserve the authority judgment and proof without reconstruction', /resultOwnership: 'preserve-authority-produced-judgment-proof-trace-and-obligations-without-reconstruction'/.test(pipeline)],
  ['authority failure cannot be replaced by a fabricated fallback judgment', /failureBehavior: 'propagate-authority-contract-failure-without-fabricating-a-fallback-judgment'/.test(pipeline)],
  ['pipeline composes scanner boundary and version 9 contract', /readonly scannerBoundary: InvocationSemanticScannerBoundaryContract/.test(pipeline) && /scannerBoundary: INVOCATION_SEMANTIC_SCANNER_BOUNDARY_CONTRACT/.test(pipeline) && /readonly version: 12/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 12,/.test(pipeline)],
  ['actual controller scanner delegates whole knowledge to runtime executor', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner)],
  ['runtime executor remains delegation-only in this interface-first phase', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(runtime) && /executeAll: batchAuthority\.analyze/.test(runtime)],
  ['authority still owns judgment validation before return', /assertInvocationSemanticJudgmentContract\(/.test(authority) && /analyzeInvocationJudgmentAlgebra\(/.test(authority)],
  ['scanner contract is reachable through upstream and public barrels', /export \* from '\.\/invocationSemanticPipelineInterface'/.test(upstream) && /INVOCATION_SEMANTIC_SCANNER_BOUNDARY_CONTRACT/.test(publicIndex) && /InvocationSemanticScannerBoundaryContract/.test(publicIndex)],
  ['contract surface adds no any, generic callable boundary, or semantic foundation dependency', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(pipeline)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1684 invocation scanner-boundary interface audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
