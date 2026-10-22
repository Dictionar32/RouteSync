const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeContract = read('packages/core/src/types/upstream/route.ts');
const producerRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const routeEmitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const checks = [
  ['existing upstream producer-input operation remains the scanner dependency', routeContract.includes('export interface RouteProducerInputComposition') && routeContract.includes('readonly compose: (input: RouteProducerInputCompositionInput) => RouteProducerInput;') && scanner.includes('routeProducerInputCompositionOperation.compose({ boundary, declaration: evidence, source: sourceSpan, methodJudgment })')],
  ['producer composition no longer accepts an optional controller map', !producerRelations.includes('existingControllerMap') && !producerRelations.includes('RelationIndex<string, RelationIndex<string, ControllerActionInfo>>')],
  ['producer composition no longer performs an unreachable empty-map lookup/refinement', !producerRelations.includes('relationFirstControllerAction') && !producerRelations.includes('refineImplicitModelBindings') && !producerRelations.includes('controllerModelReference')],
  ['producer composition no longer injects relationNone as a controller map', !producerRelations.includes('input.methodJudgment,\n            relationNone(),')],
  ['producer input preserves the parameters already closed on RouteBoundaryContract', producerRelations.includes('route.identity.parameters.all') && producerRelations.includes('former controller-map refinement was unreachable')],
  ['resource empty-map branch is retired while response projection remains explicitly open', !scanner.includes('relationNone(),\n        unresolvedResponse,') && !routeEmitter.includes('controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>') && read('packages/core/src/types/upstream/docs/PHASE2408_RESOURCE_ROUTE_EMPTY_MAP_RETIREMENT.md').includes('resolved_response_attribute_descriptor')],
  ['route scanner still imports active emitter from subscanners', scanner.includes("from '../subscanners/route-scanner'")],
  ['route scanner still imports route projection/producer composition from subscanners', scanner.includes("from '../subscanners/routeProducerRelations'")],
  ['manifest-owned invocation judgment remains in the concrete upstream manifest', read('packages/core/src/types/upstream/manifest.ts').includes('readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];')],
  ['manifest flow still reads invocation judgments from manifest, not AST', read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts').includes('invocationSemanticJudgments: manifest.invocationSemanticJudgments') && !read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts').includes('manifest.ast')],
];
let failures = 0;
for (const [name, check] of checks) {
  const passed = check;
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('Interpretation: the unreachable producer-map path is closed; resource target selection and subscanner ownership remain open blockers.\n');
process.exitCode = failures === 0 ? 0 : 1;
