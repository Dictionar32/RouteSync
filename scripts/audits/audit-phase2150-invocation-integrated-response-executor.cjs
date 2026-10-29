const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const executorContract = read('packages/core/src/types/upstream/invocationSemanticExecutionBoundaryContract.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const pipelineContract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const invocationAuthority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const requestProjection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const actionContract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const checks = [
  ['single invocation executor delegates directly to upstream authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['executor does not classify or fabricate a fallback judgment', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && !/catch\s*\(|kind:\s*'fallback_judgment'/.test(executor)],
  ['runtime contract forbids semantic derivation responsibilities', /proof-synthesis/.test(executorContract) && /obligation-invention/.test(executorContract) && /judgment-closure/.test(executorContract)],
  ['authority validates rather than re-derives semantic meaning', /validationOwnership: 'authority-validates-identity-evidence-proof-obligations-and-closure-before-return'/.test(executorContract) && /derivationSeparation: 'validate-the-algebra-produced-judgment-without-rederiving-reclassifying-or-repairing-semantic-meaning'/.test(executorContract)],
  ['single invocation pipeline forwards executor judgment', /invocationSemanticRuntimeExecutor\.execute\(input\)/.test(pipeline)],
  ['whole-knowledge analysis is distinct from independent batch analysis', /executeAll\(knowledge\)/.test(pipeline) && /whole-knowledge-analysis/.test(pipelineContract) === false && /analyze-complete-semantic-knowledge/.test(pipelineContract)],
  ['integrated response uses one canonical knowledge graph for inventory and analysis', /const knowledge = input\.semanticKnowledgeProjection\.knowledge/.test(pipeline) && /inspectKnowledge\(knowledge\)/.test(pipeline) && /analyzeKnowledge\(knowledge\)/.test(pipeline)],
  ['integrated response retains exact publication result and PHP source outcome', /publication,\s*phpFunctionInvocations: input\.phpSourceInvocationPipeline/.test(pipeline) && /sourceOutcomePreservation/.test(pipelineContract)],
  ['controller dataflow verifies source-file identity before composition', /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, sourceCorrelation\.invocationJudgment\.sourceFile\)/.test(dataflowAuthority) && /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, sourceCorrelation\.semanticKnowledgeProjection\.sourceFile\)/.test(dataflowAuthority)],
  ['controller dataflow passes exact projection and exact invocation response to composition', /semanticKnowledgeProjection: sourceCorrelation\.semanticKnowledgeProjection/.test(dataflowAuthority) && /phpSourceInvocationPipeline: sourceCorrelation\.invocationJudgment\.response/.test(dataflowAuthority)],
  ['controller dataflow judgment retains both integrated response and exact invocation judgment', /invocationSemanticIntegratedResponse: integratedResponse/.test(dataflowAuthority) && /invocationJudgment: sourceCorrelation\.invocationJudgment/.test(dataflowAuthority)],
  ['Laravel scanner continues to delegate response judgment to existing response pipeline', /this\.responseSemanticPipeline\.judgeIntegratedResponse/.test(scanner)],
  ['typed request projection loss remains explicitly open instead of falsely closed', /typed_request_binding_projection_loss/.test(actionContract) && /canonical-action-request-judgment-is-not-yet-wired-to-route-boundary/.test(actionContract) && /kind: 'unresolved_input'/.test(requestProjection)],
  ['no relation/foundation or new subscanner introduced', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/invocation-semantic'))],
];
const syntaxFiles = [
  'packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts',
  'packages/core/src/types/upstream/invocationSemanticExecutionBoundaryContract.ts',
  'packages/core/src/types/upstream/invocationSemanticPipeline.ts',
  'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts',
  'packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts',
  'packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts',
  'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts',
];
for (const file of syntaxFiles) {
  const result = ts.transpileModule(read(file), { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  checks.push([`syntax transpilation: ${file}`, !(result.diagnostics ?? []).some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)]);
}
const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 2150,
  title: 'Invocation Judgment, Integrated Response, Runtime Executor Interface Trace',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  limitations: [
    'This phase hardens trace and regression coverage; it does not claim to close the downstream typed-request projection gap.',
    'No full build, full typecheck, or Vitest run.',
    'Static source assertions and syntax-only transpilation do not establish runtime correctness.'
  ]
};
fs.writeFileSync(path.join(root, 'reports/phase2150/PHASE2150_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`Phase 2150: ${report.passed}/${report.total} passed\n`);
if (failed.length) process.exitCode = 1;
