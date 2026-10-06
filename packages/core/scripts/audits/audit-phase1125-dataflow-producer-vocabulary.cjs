const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const semantic = read('src/types/upstream/semanticDataflow.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');
const request = read('src/types/upstream/semanticDataflowRequestProjection.ts');
const route = read('src/types/upstream/semanticDataflowRouteProjection.ts');
const controller = read('src/types/upstream/semanticDataflowControllerProjection.ts');
const query = read('src/types/upstream/semanticDataflowControllerQueryProjection.ts');
const adapter = read('src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts');
const sourceModel = read('src/types/upstream/highLevelSourceModel.ts');
const checks = {
  runtimeProducerVocabularyClosed: /SemanticDataflowLineageProducer = 'request' \| 'route' \| 'controller' \| 'resource'/.test(semantic),
  noStructuralProducerInRuntimeLineage: !/SemanticDataflowLineageProducer =[^;]*(model_relation|schema)/.test(semantic),
  manifestUsesCanonicalProjections: ['semanticDataflowRouteParameterFacts','semanticDataflowControllerFacts','semanticDataflowControllerQueryFacts','semanticDataflowRequestFacts'].every(n => manifest.includes(n)),
  requestProducesRequestLineage: (request.match(/,\s*'request'/g) || []).length > 0,
  routeProducesRouteLineage: (route.match(/,\s*'route'/g) || []).length > 0,
  controllerProducesControllerLineage: (query.match(/,\s*'controller'/g) || []).length > 0,
  resourceProducesResourceLineage: (controller.match(/,\s*'resource'/g) || []).length > 0,
  adapterProducerExplicit: /producer: 'route' \| 'controller'/.test(adapter),
  noModelRelationDataflowProducer: !/semanticDataflowFactWithLineage\([^\n]*['"]model_relation['"]/.test(sourceModel + manifest + request + route + controller + query + adapter),
  noSchemaDataflowProducer: !/semanticDataflowFactWithLineage\([^\n]*['"]schema['"]/.test(sourceModel + manifest + request + route + controller + query + adapter),
  genericDataFlowInterface: /export type DataFlowInterface<[^>]+>/.test(read('src/types/dataflow/dataFlowInterface.ts')) && !/Laravel|Route|Controller|Model|Resource|Schema/.test(read('src/types/dataflow/dataFlowInterface.ts')),
  genericDirectionalBoundary: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(read('src/types/interfaces/interfaceDependencyBoundary.ts')) && /project:/.test(read('src/types/interfaces/interfaceDependencyBoundary.ts')),
  legacyScannerAbsent: !/StaticLaravelScanner|LaravelScanner/.test(read('src/index.ts') + read('src/compiler/index.ts')),
  cliUsesPackageSurface: !fs.readdirSync(path.join(root, '../cli/src/commands')).some(file => file.endsWith('.ts') && /packages\/core\/src/.test(read('../cli/src/commands/' + file))),
};
const violations = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
const result = { phase: 1125, direction: 'upstream => wiring => interface => downstream', checks, violations, passed: violations.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
