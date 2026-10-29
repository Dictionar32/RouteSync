const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const projectionPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowRouteProjection.ts');
const producerPath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowInputFactory.ts');
const projection = fs.readFileSync(projectionPath, 'utf8');
const producer = fs.readFileSync(producerPath, 'utf8');
const checks = [
  ['legacy direct projection export removed', !/export\s+const\s+semanticDataflowRouteParameterFacts\b/.test(projection)],
  ['projection implementation is private', /const\s+projectRouteParameterFactsFromSourceModel\s*=/.test(projection) && /const\s+projectRouteParameterFacts\s*=/.test(projection)],
  ['projection result has explicit ADT kind', /kind:\s*'semantic_dataflow_route_projection_result'/.test(projection)],
  ['projection result exposes domain continuation', /readonly\s+continueWith:\s*<Result>/.test(projection)],
  ['projection authority has explicit interface', /export interface SemanticDataflowRouteProjectionAuthorityInterface/.test(projection) && /export const semanticDataflowRouteProjectionAuthority:\s*SemanticDataflowRouteProjectionAuthorityInterface/.test(projection)],
  ['runtime consumer continues through projection ADT', /projections\.route\.project\(sourceModel, controller\)\.continueWith\(/.test(producer)],
  ['consumer does not directly spread projection result', !/\.\.\.projections\.route\.project\(sourceModel, controller\)\s*,/.test(producer)],
  ['route and model binding facts remain generated from source model', /routeBindingTarget\(controller, routeParameter\)/.test(projection) && /identityForRouteParameter\(route, routeParameter\)/.test(projection)],
];
const result = {
  phase: 3016,
  title: 'Route projection result ADT and explicit domain continuation',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
};
const out = path.join(root, 'PHASE3016_AUDIT.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
