const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(p, 'utf8');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith('.ts') && !p.endsWith('.test.ts')) files.push(p);
  }
}
walk(core);

const factory = path.join(core, 'compiler/scanner/semantic/route/routeParameterSemanticFactory.ts');
const pathParser = path.join(core, 'compiler/scanner/subscanners/route-scanner/routePathParser.ts');
const boundary = path.join(core, 'compiler/scanner/resolvers/boundary/boundaryBasics.ts');
const producer = path.join(core, 'compiler/scanner/subscanners/routeProducerRelations.ts');
const flowFactory = path.join(core, 'compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts');

const text = files.map(p => ({ p, t: read(p) }));
const productionFactoryImports = text.filter(({ p, t }) => p !== factory && /RouteParameterSemanticFactory/.test(t)).map(({p}) => path.relative(root,p));
const pathSegmentCalls = text.filter(({ t }) => /RouteParameterSemanticFactory\.fromPathSegment\s*\(/.test(t)).map(({p}) => path.relative(root,p));
const directBoundaryFallback = read(boundary).includes('RouteParameterSemanticFactory.fromPathSegment(value)');
const producerPassesParameters = read(producer).includes('parameters: emission.path.parameters');
const producerPassesRuntimePath = read(producer).includes('runtimePath: emission.path.runtimePath');
const producerPassesConstantKey = read(producer).includes('constantKey: SemanticValueFactory.propertyName(emission.path.constantKey)');
const sparseFactoryProductionRefs = text.filter(({ p, t }) => p !== flowFactory && /RouteSemanticFlowFactory\.fromSparse\s*\(/.test(t)).map(({p}) => path.relative(root,p));
const routeBoundaryFactoryRefs = text.filter(({ p, t }) => p !== path.join(core, 'compiler/scanner/resolvers/boundary/boundaryContractFactory.ts') && /RouteBoundaryContractFactory\.create\s*\(/.test(t)).map(({p}) => path.relative(root,p));

const report = {
  phase: 885,
  authority: 'route_parameter',
  classification: directBoundaryFallback && producerPassesParameters && producerPassesRuntimePath && producerPassesConstantKey && sparseFactoryProductionRefs.length === 0 ? 'COMPATIBILITY_FALLBACK_ONLY' : 'REVIEW_REQUIRED',
  canonicalProducer: path.relative(root, factory),
  productionPathParameterProducers: pathSegmentCalls,
  productionRouteBoundaryFactoryConsumers: routeBoundaryFactoryRefs,
  sparseRouteSemanticFlowProductionConsumers: sparseFactoryProductionRefs,
  boundaryFallbackRecomputesFromPath: directBoundaryFallback,
  routeProducerPassesCanonicalParameters: producerPassesParameters,
  routeProducerPassesCanonicalRuntimePath: producerPassesRuntimePath,
  routeProducerPassesCanonicalConstantKey: producerPassesConstantKey,
  conclusion: 'RouteParameterSemanticFactory is the canonical parameter producer. Boundary path parsing remains a compatibility fallback because production RouteBoundaryContractFactory input already carries emission.path.parameters. Do not create a second RouteParameterEvidence abstraction.'
};

fs.writeFileSync(path.join(root, 'scripts/audits/phase885-route-parameter-authority.json'), JSON.stringify(report, null, 2) + '\n');
const ok = report.classification === 'COMPATIBILITY_FALLBACK_ONLY';
console.log(JSON.stringify({ ...report, pass: ok }, null, 2));
process.exit(ok ? 0 : 1);
