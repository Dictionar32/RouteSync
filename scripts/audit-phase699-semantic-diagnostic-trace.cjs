const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const run = file => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', file)], { cwd: root, encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  try { return JSON.parse(output); } catch { return { status: 'FAIL', raw: output }; }
};

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const productionFiles = fs.readdirSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors/route'));
const legacyRouteParameter = read('packages/core/src/compiler/scanner/descriptors/route/params/routeParameterDescriptorClass.ts');
const relationFactory = read('packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts');
const relationDescriptor = read('packages/core/src/compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass.ts');
const eloquent = read('packages/core/src/types/domain/eloquentTypes.ts');

const trace = {
  phase: 699,
  kind: 'semantic-diagnostic-trace',
  diagnostics: {
    phase686: run('audit-phase686-build-diagnostic.cjs'),
    phase687: run('audit-phase687-build-diagnostic.cjs'),
    phase688: run('audit-phase688-semantic-build-frontier.cjs'),
    phase690: run('audit-phase690-diagnostic-semantic-frontier.cjs'),
    phase691: run('audit-phase691-ir-semantic-frontier.cjs'),
    phase696: run('audit-phase696-semantic-diagnostic-frontier.cjs'),
  },
  routeParameterBoundary: {
    legacyDescriptorFileBytes: Buffer.byteLength(legacyRouteParameter),
    legacyDescriptorEmpty: legacyRouteParameter.length === 0,
    activeParameterSemanticFactory: productionFiles.includes('routeParameters.ts'),
  },
  relationCardinalityBoundary: {
    nestedCardinalityDiscriminant: relationFactory.includes('resolvedCardinality.kind'),
    exactSingleReturn: relationFactory.includes('cardinality: { kind: "one" }'),
    exactCollectionReturn: relationFactory.includes('cardinality: { kind: "many" }'),
    descriptorCastsRemoved: !relationDescriptor.includes('as SingleRelationDescriptor') && !relationDescriptor.includes('as CollectionRelationDescriptor'),
    matcherUsesTypeRefinement: eloquent.includes('isSingleRelationDescriptor') && eloquent.includes('isCollectionRelationDescriptor'),
  },
  forbiddenCompatibilityPatterns: {
    routeParameterLegacyCast: legacyRouteParameter.includes('as unknown'),
    relationDescriptorUnknownCast: relationDescriptor.includes('as unknown'),
  },
};

const values = [
  trace.diagnostics.phase686.status,
  trace.diagnostics.phase687.status,
  trace.diagnostics.phase688.status,
  trace.diagnostics.phase690.status,
  trace.diagnostics.phase691.status,
  trace.diagnostics.phase696.status,
];
trace.status = values.every(value => value === 'PASS') &&
  trace.routeParameterBoundary.legacyDescriptorEmpty &&
  trace.relationCardinalityBoundary.nestedCardinalityDiscriminant &&
  trace.relationCardinalityBoundary.exactSingleReturn &&
  trace.relationCardinalityBoundary.exactCollectionReturn &&
  trace.relationCardinalityBoundary.descriptorCastsRemoved &&
  trace.relationCardinalityBoundary.matcherUsesTypeRefinement &&
  !trace.forbiddenCompatibilityPatterns.routeParameterLegacyCast &&
  !trace.forbiddenCompatibilityPatterns.relationDescriptorUnknownCast
  ? 'PASS' : 'FAIL';

process.stdout.write(JSON.stringify(trace, null, 2));
