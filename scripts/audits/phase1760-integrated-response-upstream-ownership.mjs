import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const astTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const regression = read('packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');

const checks = [
  ['integrated response contract advanced to v5', /InvocationSemanticIntegratedResponseContract[\s\S]*?readonly version: 5;/.test(contract) && /INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_CONTRACT[\s\S]*?version: 5,/.test(contract)],
  ['composition contract advanced to v8', /InvocationSemanticIntegratedResponseCompositionContract[\s\S]*?readonly version: 8;/.test(contract) && /INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT[\s\S]*?version: 8,/.test(contract)],
  ['pipeline contract advanced to v56', /InvocationSemanticPipelineContract[\s\S]*?readonly version: 56;/.test(contract) && /INVOCATION_SEMANTIC_PIPELINE_CONTRACT[\s\S]*?version: 56,/.test(contract)],
  ['validated response owns the publication validation receipt', /kind: 'validated-integrated-response';[\s\S]*?publication: Extract<InvocationSemanticCoveragePublicationResult, \{ readonly kind: 'validated-publication' \}>;/.test(contract)],
  ['rejected response owns the typed rejected publication', /kind: 'rejected-integrated-response';[\s\S]*?publication: Extract<InvocationSemanticCoveragePublicationResult, \{ readonly kind: 'rejected-publication' \}>;/.test(contract)],
  ['no duplicated analysis field exists on integrated response variants', !/export type InvocationSemanticIntegratedResponse =[\s\S]*?readonly analysis: InvocationSemanticAnalysis/.test(contract)],
  ['analysis projection interface and overload helper removed', !/InvocationSemanticIntegratedResponseAnalysisProjection|projectIntegratedResponse/.test(contract + pipeline)],
  ['composition returns one publication-bound response', /return Object\.freeze\(\{\s*kind: 'invocation_semantic_integrated_response_composition_result',\s*knowledge: input\.knowledge,\s*response,\s*\}\)/.test(pipeline)],
  ['scanner delegates once to upstream composition', /invocationSemanticIntegratedResponseComposition\.integrate\(\{ knowledge: semanticKnowledgeDataFlow \}\)/.test(scanner) && !/AnalysisProjection|analysisProjection/.test(scanner)],
  ['scanner AST exposes only the atomic composition result', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;/.test(astTypes) && !/analysisProjection|invocationSemanticAnalysisProjection/.test(astTypes)],
  ['regression reads analysis through publication-owned response', /integratedAnalysis\(response\)/.test(regression) && !/analysisProjection/.test(regression)],
];

for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
}
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
