const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeJudgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const invocationPipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const invocationAnalyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const routeInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const resourceInterface = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const resourceReasoning = read('packages/core/src/types/upstream/resourceModelReasoning.ts');
const sourceScanner = read('packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts');

check('controller scanner interface only models controller-scan inputs and outputs', !controller.includes('InvocationSemanticPipelineInterface') && !controller.includes('InvocationSemanticAnalysis') && controller.includes('formRequests: readonly FormRequestSource[]') && controller.includes('actions: readonly ControllerActionFlowContract[]'));
check('invocation semantic pipeline remains at the dedicated dataflow analysis boundary', invocationPipeline.includes('analyzeKnowledge:') && invocationAnalyzer.includes('invocationSemanticPipeline.analyzeKnowledge('));
check('route candidate proof is paired with exactly one action without duplicate candidate identity in evidence', routeJudgment.includes('interface RouteControllerBindingCandidate {\n  readonly action: ControllerActionFlowContract;\n  readonly evidence: RouteControllerBindingCandidateEvidence;') && !routeJudgment.includes('readonly candidate: ControllerActionFlowContract;'));
check('route resolved and ambiguous outcomes preserve candidate-proof pairing', routeJudgment.includes("readonly kind: 'resolved';\n      readonly candidate: RouteControllerBindingCandidate") && routeJudgment.includes('readonly candidates: readonly [RouteControllerBindingCandidate, RouteControllerBindingCandidate, ...RouteControllerBindingCandidate[]]'));
check('route unresolved outcome retains non-empty source evidence without fabricating a candidate', routeJudgment.includes("readonly kind: 'unresolved';\n      readonly reason:") && routeJudgment.includes('readonly evidence: RouteControllerBindingSourceEvidenceSet'));
check('resource model candidate policy explicitly specifies precedence and tie ambiguity', routeJudgment.includes('resourceCandidatePolicy: \'apply-explicit-source-precedence-then-preserve-distinct-model-ties-as-ambiguous\''));
check('resource scanner contract consumes canonical model definitions and relation evidence', resourceInterface.includes('modelDefinitions: readonly ModelDefinition[]') && resourceInterface.includes('relationEvidence: readonly ResourceRelationBindingEvidence[]') && !resourceInterface.includes('ModelSymbolTable'));
check('resource reasoning first-match behavior is reported as an implementation gap, not hidden by interface wording', resourceReasoning.includes('const selected = relationFirst') && resourceReasoning.includes('candidates.find(candidate => candidate.source === source)'));
check('pipeline is still recognized as not yet migrated to subscanner interfaces', pipeline.includes('ModelScanner.scanCanonicalBundle') && pipeline.includes('RouteScanner.scanCanonicalBundle'));
check('source AST scanner interface remains a thin source-project boundary', sourceScanner.includes('scan: (sourceProject: SourceProjectIdentity) => Promise<SourceAsts>'));
check('no new semantic/foundation dependency is declared in changed interface files', ![controller, routeJudgment, routeInterface, resourceInterface].some((content) => content.includes("semantic/foundation")));
check('new contract surface avoids explicit any', ![controller, routeJudgment, routeInterface, resourceInterface].some((content) => /\bany\b/.test(content)));

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
const failed = checks.filter((item) => !item.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} interface-first correction checks passed.\n`);
process.stdout.write('OPEN GAPS: production pipeline wiring is unchanged; resourceModelReasoning still uses first-match precedence and does not yet implement explicit ambiguity.\n');
if (failed.length) process.exit(1);
