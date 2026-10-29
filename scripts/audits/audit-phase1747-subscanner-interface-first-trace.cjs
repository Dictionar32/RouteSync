const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed, finding = '') => checks.push({ name, passed: Boolean(passed), finding });

const interfacePaths = {
  route: 'packages/core/src/types/upstream/laravelRouteScannerInterface.ts',
  controller: 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts',
  model: 'packages/core/src/types/upstream/laravelModelScannerInterface.ts',
  formRequest: 'packages/core/src/types/upstream/laravelFormRequestScannerInterface.ts',
  resource: 'packages/core/src/types/upstream/laravelResourceScannerInterface.ts',
  channel: 'packages/core/src/types/upstream/laravelChannelScannerInterface.ts',
};
const sources = Object.fromEntries(Object.entries(interfacePaths).map(([key, file]) => [key, read(file)]));
const implementationPaths = {
  route: 'packages/core/src/compiler/scanner/operations/RouteScanner.ts',
  controller: 'packages/core/src/compiler/scanner/operations/ControllerScanner.ts',
  model: 'packages/core/src/compiler/scanner/operations/ModelScanner.ts',
  formRequest: 'packages/core/src/compiler/scanner/operations/FormRequestScanner.ts',
  resource: 'packages/core/src/compiler/scanner/operations/ResourceScanner.ts',
  channel: 'packages/core/src/compiler/scanner/operations/ChannelScanner.ts',
};
const implementations = Object.fromEntries(Object.entries(implementationPaths).map(([key, file]) => [key, read(file)]));

for (const [key, file] of Object.entries(interfacePaths)) {
  check(`${key} upstream scanner interface exists`, exists(file));
  check(`${key} interface declares a closed typed scan boundary`, sources[key].includes('readonly closed: true') && sources[key].includes('readonly scan:'));
  check(`${key} concrete scanner does not falsely claim interface adoption`, !new RegExp(`implements\\s+${({ route: 'LaravelRouteScannerInterface', controller: 'LaravelControllerScannerInterface', model: 'LaravelModelScannerInterface', formRequest: 'LaravelFormRequestScannerInterface', resource: 'LaravelResourceScannerInterface', channel: 'LaravelChannelScannerInterface' })[key]}\\b`).test(implementations[key]), 'Interface adoption is still an open wiring task.');
}

const controller = sources.controller;
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const route = implementations.route;
const channel = implementations.channel;
const resource = implementations.resource;
const model = implementations.model;
const formRequest = implementations.formRequest;

check('controller boundary contract version is synchronized', controller.includes('readonly version: 35') && controller.includes('version: 35,'));
check('controller contract states ordinary integrated response is already wired', controller.includes('ordinary-invocation-integrated-response-composition-is-wired-through-the-upstream-interface'));
check('controller contract does not claim static invocation coverage', controller.includes('static-invocation-remains-uncovered') && controller.includes('static-invocation-algebra-authority-and-coverage-publication-remain-unimplemented'));
check('controller dataflow calls the single integrated-response interface', analyzer.includes('invocationSemanticIntegratedResponseComposition.integrate({ knowledge: semanticKnowledgeDataFlow })'));
check('controller dataflow retains integrated response and exact knowledge binding', analyzer.includes('invocationSemanticIntegratedResponse') && analyzer.includes('return Object.freeze({ semanticKnowledgeDataFlow, semanticVariables, invocationSemanticAnalysis, invocationSemanticIntegratedResponse })'));
check('legacy analysis projection is exhaustive over integrated-response variants', analyzer.includes("case 'validated-integrated-response':") && analyzer.includes("case 'rejected-integrated-response':") && analyzer.includes('const exhaustive: never = invocationSemanticIntegratedResponse.response'));
check('composition preserves the same knowledge object for inventory and analysis', composition.includes('dependencies.inventory.inspectKnowledge(input.knowledge)') && composition.includes('dependencies.pipeline.analyzeKnowledge(input.knowledge)') && composition.includes('knowledge: input.knowledge'));
check('publication authority owns correspondence validation', composition.includes('dependencies.publicationAuthority.publish({ inventory, analysis })'));
check('route scanner contract owns route-target binding as a stable authority', sources.route.includes('readonly bindingAuthority: RouteControllerBindingJudgmentAuthority'));
check('resource interface receives canonical model definitions and relation evidence', sources.resource.includes('modelDefinitions: readonly ModelDefinition[]') && sources.resource.includes('relationEvidence: readonly ResourceRelationBindingEvidence[]'));
check('resource implementation gap is not hidden: local model resolution remains present', /resolveInitialModel|propagateRelationEdges/.test(resource), 'ResourceScanner still performs local resolution/data-flow propagation; interface adoption and reasoning ownership require a separate migration.');
check('route implementation contains local route method/path/action decisions', /resolveRouteHttpMethod|resolveRoutePath|actionNameOf/.test(route), 'RouteScanner still makes local routing decisions; do not mistake the upstream interface for an adopted runtime boundary.');
check('channel implementation contains local channel-kind classification', /isPresence|isPrivate|BroadcastChannelKind/.test(channel), 'ChannelScanner still classifies channel kind in scanner runtime; move this decision only after a closed upstream judgment contract is established.');
check('model implementation remains a direct class facade, not an interface implementation', /static async scan|static scan|scanCanonicalBundle/.test(model));
check('form-request implementation remains a direct class facade, not an interface implementation', /static async scan|static scan|scanCanonicalBundle/.test(formRequest));
check('source pipeline directly invokes concrete subscanner facades', pipeline.includes('ModelScanner.scanCanonicalBundle') && pipeline.includes('RouteScanner.scanCanonicalBundle'));
check('no foundation dependency introduced in changed upstream controller interface', !controller.includes('semantic/foundation'));

const result = {
  phase: 1747,
  title: 'Subscanner Interface-First Trace and Invocation Boundary Truthfulness',
  status: checks.every(item => item.passed) ? 'PASS' : 'FAIL',
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  checks,
  openGaps: [
    'The six upstream Laravel scanner interfaces exist but their concrete subscanner classes do not implement them yet.',
    'laravelSourceAstPipeline.ts still invokes concrete scanner facades directly.',
    'RouteScanner retains local route method/path/action decisions.',
    'ResourceScanner retains local model resolution and relation propagation.',
    'ChannelScanner retains local channel-kind classification.',
    'Static invocation algebra/authority/coverage remains unimplemented; ordinary invocation integrated response is wired.',
    'No typecheck or package build is performed by this audit.'
  ]
};
fs.writeFileSync(path.join(root, 'PHASE1747_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.finding ? ` — ${item.finding}` : ''}\n`);
process.stdout.write(`\n${result.passed}/${result.total} checks passed.\n`);
if (result.status !== 'PASS') process.exitCode = 1;
