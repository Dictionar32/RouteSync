import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const pipelineInterface = read('../../packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipeline = read('../../packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scannerTypes = read('../../packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const scannerAnalyzer = read('../../packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scannerTest = read('../../packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');

const checks = [
  ['composition contract version 6', /InvocationSemanticIntegratedResponseCompositionContract[\s\S]*?readonly version: 6/.test(pipelineInterface)],
  ['composition result owns projection', /interface InvocationSemanticIntegratedResponseCompositionResult[\s\S]*?readonly response: InvocationSemanticIntegratedResponse;[\s\S]*?readonly analysisProjection: InvocationSemanticIntegratedResponseAnalysisProjection;/.test(pipelineInterface)],
  ['composition creates projection from same response', /response,\s*analysisProjection: projectIntegratedResponse\(response\)/.test(pipeline)],
  ['scanner AST exposes only atomic composition result', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;/.test(scannerTypes) && !/invocationSemanticAnalysisProjection/.test(scannerTypes)],
  ['scanner does not call projection separately', !/invocationSemanticIntegratedResponseAnalysisProjection\.project/.test(scannerAnalyzer)],
  ['scanner does not return detached projection field', !/invocationSemanticAnalysisProjection/.test(scannerAnalyzer)],
  ['regression test reads correlated projection from composition result', /invocationSemanticIntegratedResponse\.analysisProjection/.test(scannerTest)],
  ['legacy detached projection property removed from scanner source', !/invocationSemanticAnalysisProjection/.test(scannerTest)],
];

for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
}
const failures = checks.filter(([, passed]) => !passed);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length > 0) process.exitCode = 1;
