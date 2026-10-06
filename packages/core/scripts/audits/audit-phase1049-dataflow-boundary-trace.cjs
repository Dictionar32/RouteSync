const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const repoRead = relative => fs.readFileSync(path.join(repo, relative), 'utf8');
const repoExists = relative => fs.existsSync(path.join(repo, relative));

const walk = dir => {
  const absolute = path.join(root, dir);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
};

const upstreamFiles = walk('src/types/upstream')
  .filter(file => /\.tsx?$/.test(file) && !file.includes(`${path.sep}__tests__${path.sep}`));
const upstreamTexts = upstreamFiles.map(file => ({ file, text: read(file) }));

const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const projection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const adapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const composition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const index = read('src/index.ts');

const fixture = relative => repoRead(path.join('examples/ecommerce-shop-source', relative));
const fixtureExists = relative => repoExists(path.join('examples/ecommerce-shop-source', relative));

const routeApi = fixture('routes/api.php');
const orderController = fixture('app/Http/Controllers/OrderController.php');
const orderModel = fixture('app/Models/Order.php');
const orderResource = fixture('app/Http/Resources/OrderResource.php');
const migrations = fixtureExists('database/migrations')
  ? fs.readdirSync(path.join(repo, 'examples/ecommerce-shop-source/database/migrations'))
      .filter(name => name.endsWith('.php'))
      .map(name => repoRead(path.join('examples/ecommerce-shop-source/database/migrations', name))).join('\n')
  : '';

const checks = {
  canonicalDataFlowIsGeneric:
    /export type DataFlowInterface<Input, State, Node>/.test(dataflow) &&
    !/Laravel|Route|Controller|Resource|Schema|Graph/.test(dataflow),
  dependencyBoundaryIsDirectional:
    /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  projectionIsDataFlowSpecialization:
    /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection),
  authorityOwnsClosureOnly:
    /createSemanticDataflowJudgment/.test(authority) &&
    /reachClosure/.test(authority) &&
    !/DataFlowInterface|InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(authority),
  adapterOwnsRuntimeWiring:
    /createSemanticDataflowDataFlowInterface/.test(adapter) &&
    /DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(adapter),
  compositionOwnsWiring:
    /createSemanticDataflowDataFlowInterface/.test(composition),
  irConsumesClosedGenericState:
    /DataFlowProjectionInterface/.test(irInterface) &&
    /dataflow\.state\.closure/.test(ir),
  graphUsesStructuralBoundary:
    /InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface) &&
    !/DataFlowProjectionInterface/.test(graph),
  upstreamDoesNotImportDownstream:
    upstreamTexts.every(({ text }) =>
      !/InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(text)),
  fixtureHasRoutes:
    /Route::(get|post|put|patch|delete)\(/.test(routeApi),
  fixtureHasControllerDataflowEvidence:
    /OrderResource|->load\(/.test(orderController),
  fixtureHasModelRelations:
    /belongsTo\(|hasMany\(/.test(orderModel),
  fixtureHasResource:
    /class OrderResource/.test(orderResource),
  fixtureHasSchemaEvidence:
    /foreignId|foreign\(|constrained\(/.test(migrations),
  rootDoesNotExportConcreteGraphBuilder:
    !/export\s*\{\s*ServiceGraphBuilder\s*\}/.test(index),
  phase1049AuditIsLocal:
    repoExists('packages/core/scripts/audits/audit-phase1049-dataflow-boundary-trace.cjs'),
};

const output = { checks };
output.clean = Object.values(checks).every(Boolean);
console.log(JSON.stringify(output, null, 2));
if (!output.clean) process.exit(1);
