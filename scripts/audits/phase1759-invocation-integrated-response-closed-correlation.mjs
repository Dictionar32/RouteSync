import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const contract = read('../../packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipeline = read('../../packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scannerTypes = read('../../packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const scannerAnalyzer = read('../../packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const scannerTest = read('../../packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');

const checks = [
  ['composition contract is version 7', /InvocationSemanticIntegratedResponseCompositionContract[\s\S]*?readonly version: 7/.test(contract) && /kind: 'invocation_semantic_integrated_response_composition_contract',[\s\S]*?version: 7/.test(contract)],
  ['result is a closed discriminated union', /export type InvocationSemanticIntegratedResponseCompositionResult\s*=\s*\| Readonly<[\s\S]*?\| Readonly</.test(contract)],
  ['validated response is type-correlated with validated projection', /response: Extract<InvocationSemanticIntegratedResponse, \{ readonly kind: 'validated-integrated-response' \}>;[\s\S]*?analysisProjection: Extract<InvocationSemanticIntegratedResponseAnalysisProjection, \{ readonly kind: 'validated-integrated-response-analysis' \}>;/.test(contract)],
  ['rejected response is type-correlated with rejected projection', /response: Extract<InvocationSemanticIntegratedResponse, \{ readonly kind: 'rejected-integrated-response' \}>;[\s\S]*?analysisProjection: Extract<InvocationSemanticIntegratedResponseAnalysisProjection, \{ readonly kind: 'rejected-integrated-response-analysis' \}>;/.test(contract)],
  ['contract declares type-level correlation as an invariant', /closed-discriminated-result-correlates-validated-or-rejected-response-with-the-matching-analysis-projection-at-the-type-level/.test(contract)],
  ['projection operation has variant-preserving overloads', /function projectIntegratedResponse\([\s\S]*?validated-integrated-response[\s\S]*?function projectIntegratedResponse\([\s\S]*?rejected-integrated-response/.test(pipeline)],
  ['composition narrows outcome before returning correlated pair', /switch \(response\.kind\)[\s\S]*?case 'validated-integrated-response':[\s\S]*?analysisProjection: projectIntegratedResponse\(response\)[\s\S]*?case 'rejected-integrated-response':[\s\S]*?analysisProjection: projectIntegratedResponse\(response\)/.test(pipeline)],
  ['scanner AST consumes the atomic composition result', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;/.test(scannerTypes) && !/invocationSemanticAnalysisProjection/.test(scannerTypes)],
  ['scanner does not separately invoke projection', !/invocationSemanticIntegratedResponseAnalysisProjection\.project/.test(scannerAnalyzer)],
  ['regression test consumes projection through composition result', /invocationSemanticIntegratedResponse\.analysisProjection/.test(scannerTest) && !/invocationSemanticAnalysisProjection/.test(scannerTest)],
];

for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failures = checks.filter(([, passed]) => !passed);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length > 0) process.exitCode = 1;
