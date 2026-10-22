import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = path => readFileSync(resolve(process.cwd(), path), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scannerTypes = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const scannerBoundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const regression = read('packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');

const checks = [
  ['integrated response contract is version 6', /InvocationSemanticIntegratedResponseContract[\s\S]*?readonly version: 6;/.test(contract) && /INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_CONTRACT[\s\S]*?version: 6,/.test(contract)],
  ['integrated response aliases the canonical publication result', /export type InvocationSemanticIntegratedResponse = InvocationSemanticCoveragePublicationResult;/.test(contract)],
  ['composition contract is version 9', /InvocationSemanticIntegratedResponseCompositionContract[\s\S]*?readonly version: 9;/.test(contract) && /INVOCATION_SEMANTIC_INTEGRATED_RESPONSE_COMPOSITION_CONTRACT[\s\S]*?version: 9,/.test(contract)],
  ['composition contract forbids a second response wrapper', /responseOwnership: 'integrated-response-is-the-exact-publication-result-without-a-second-discriminator-or-wrapper'/.test(contract)],
  ['composition forwards the exact publication result directly', /const response: InvocationSemanticIntegratedResponse = dependencies\.publicationAuthority\.publish\(\{ inventory, analysis \}\);/.test(pipeline)],
  ['composition has no response discriminator reconstruction', !/validated-integrated-response|rejected-integrated-response|switch \(publication\.kind\)/.test(pipeline)],
  ['pipeline contract is version 57', /InvocationSemanticPipelineContract[\s\S]*?readonly version: 57;/.test(contract) && /INVOCATION_SEMANTIC_PIPELINE_CONTRACT[\s\S]*?version: 57,/.test(contract)],
  ['Laravel scanner boundary contract is version 36', /LaravelControllerInvocationSemanticBoundaryContract[\s\S]*?readonly version: 36;/.test(scannerBoundary) && /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT[\s\S]*?version: 36,/.test(scannerBoundary)],
  ['scanner delegates composition once without response reconstruction', /invocationSemanticIntegratedResponseComposition\.integrate\(\{ knowledge: semanticKnowledgeDataFlow \}\)/.test(scanner) && !/validated-integrated-response|rejected-integrated-response|publication:/.test(scanner)],
  ['scanner AST keeps one integrated response result field', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;/.test(scannerTypes)],
  ['regression reads the canonical publication discriminator', /case 'validated-publication'/.test(regression) && /case 'rejected-publication'/.test(regression) && !/validated-integrated-response|rejected-integrated-response/.test(regression)],
  ['no legacy integrated-response wrapper tags remain in active invocation pipeline', !/validated-integrated-response|rejected-integrated-response/.test(contract + pipeline + scanner + scannerTypes + regression)],
];

for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
