const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const body = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const runtime = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing Laravel scanner boundary evolves in place to v69 after canonical dataflow retention', /readonly version: 69/.test(boundary) && /version: 69,/.test(boundary)],
  ['boundary declares atomic judgment ownership for dataflow projection', /readonly dataflowProjectionInputOwnership: 'controller-dataflow-executor-receives-the-canonical-invocation-judgment-as-one-value-and-derives-source-identity-and-integrated-response-from-that-same-judgment'/.test(boundary) && /dataflowProjectionInputOwnership: 'controller-dataflow-executor-receives-the-canonical-invocation-judgment-as-one-value-and-derives-source-identity-and-integrated-response-from-that-same-judgment'/.test(boundary)],
  ['body parser forwards the exact canonical judgment as one value', /buildDataflow\(parsedBlock, parameters, parameterSemantics, context\.judgment\)/.test(body) && /judgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(body)],
  ['dataflow binding accepts judgment rather than detached source path and response', /analyzeControllerDataflowWithInvocationJudgment/.test(runtime) && /judgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(runtime) && /judgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(analyzer) && !/filePath: string,\s*integratedResponse:/.test(runtime + analyzer)],
  ['runtime derives source identity and response from the same judgment', /judgment\.response/.test(analyzer) && /judgment\.sourceFile\.value\.value/.test(analyzer)],
  ['canonical judgment remains the single outcome-indexed model', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment) && !/InvocationSemanticJudgmentV2/.test(judgment + boundary)],
  ['no semantic foundation dependency is introduced into touched contract and runtime files', !/semantic\/foundation/.test(boundary + body + runtime + judgment)],
  ['no old detached-argument dataflow binding call remains', !/analyzeControllerDataflowWithIntegratedResponse/.test(body + runtime)],
  ['audit command is registered', pkg.scripts['audit:phase1901-controller-dataflow-judgment-boundary-interface-first'] === 'node scripts/audits/audit-phase1901-controller-dataflow-judgment-boundary-interface-first.cjs'],
  ['existing syntax-only projection remains semantically absent', /kind === 'syntax_only'[\s\S]*dataflow: undefined/.test(body)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
