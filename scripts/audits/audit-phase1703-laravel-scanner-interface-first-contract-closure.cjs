const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => {
  checks.push({ name, passed: Boolean(condition) });
};

const judgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const route = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const resource = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const reasoning = read('packages/core/src/types/upstream/resourceModelReasoning.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');

check('route scanner interface owns closed route-controller authority outside per-operation input', route.includes('readonly bindingAuthority: RouteControllerBindingJudgmentAuthority') && !route.match(/export interface LaravelRouteScanInput[\s\S]*?bindingAuthority/));
check('route scan preserves authority judgments on each route artifact', route.includes('readonly binding: RouteControllerBindingJudgment;') && route.includes('readonly artifacts: readonly LaravelRouteScanArtifact[]'));
check('route unresolved evidence does not require a candidate', judgment.includes('RouteControllerBindingSourceEvidenceSet') && judgment.includes("readonly kind: 'unresolved'"));
check('route candidate evidence is separate and source-backed', judgment.includes('RouteControllerBindingCandidateEvidence') && judgment.includes('readonly source: SourceSpan'));
check('ambiguous route outcome requires at least two candidate-evidence pairs', judgment.includes('readonly [RouteControllerBindingCandidate, RouteControllerBindingCandidate, ...RouteControllerBindingCandidate[]]'));
check('resource scanner accepts canonical model definitions rather than symbol-table internals', resource.includes('modelDefinitions: readonly ModelDefinition[]') && !resource.includes('ModelSymbolTable'));
check('resource scanner injects binding authority and source relation evidence', resource.includes('bindingAuthority: ResourceModelBindingJudgmentAuthority') && resource.includes('relationEvidence: readonly ResourceRelationBindingEvidence[]'));
check('resource scan preserves model-binding judgment on each resource artifact', resource.includes('readonly modelBinding: ResourceModelBindingJudgment;') && resource.includes('readonly resources: readonly LaravelResourceScanArtifact[]'));
check('resource evidence basis matches upstream candidate vocabulary including structural', judgment.includes("'controller_dataflow' | 'relation_propagation' | 'convention' | 'structural'") && reasoning.includes("| 'structural'"));
check('controller scanner does not duplicate invocation analysis ownership', !controller.includes('InvocationSemanticPipelineInterface') && !controller.includes('InvocationSemanticAnalysis') && invocation.includes('analyzeKnowledge:'));
check('controller actions are grouped with their controller AST', controller.includes('interface LaravelControllerScanArtifact') && controller.includes('readonly ast: ControllerAst;') && controller.includes('readonly actions: readonly ControllerActionFlowContract[];'));
check('audit accurately detects that production pipeline still bypasses scanner interfaces', pipeline.includes('ModelScanner.scanCanonicalBundle') && pipeline.includes('RouteScanner.scanCanonicalBundle'));
check('audit accurately detects existing resource authority has first-match precedence and no ambiguous outcome', reasoning.includes('resourceModelCandidateAtPrecedence') && reasoning.includes('const selected = relationFirst') && !reasoning.includes("readonly kind: 'ambiguous'"));

for (const item of checks) {
  process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
}
const failed = checks.filter((item) => !item.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} interface-contract trace checks passed.\n`);
process.stdout.write('KNOWN MIGRATION GAPS: pipeline wiring is unchanged; resource-model authority still uses first-match precedence. These are reported gaps, not passes for migration completion.\n');
if (failed.length > 0) process.exit(1);
