const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const route = read('src/types/upstream/semanticDataflowRouteProjection.ts');
const resource = read('src/types/upstream/semanticDataflowControllerProjection.ts');
const query = read('src/types/upstream/semanticDataflowControllerQueryProjection.ts');
const adapter = read('src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');

const result = {
  factLineageTypeExists: /export type SemanticDataflowFactLineage/.test(semantic),
  dependencyCarriesLineage: /readonly lineage\?: SemanticDataflowFactLineage/.test(semantic),
  valueFlowCarriesLineage: (semantic.match(/readonly lineage\?: SemanticDataflowFactLineage/g) || []).length >= 2,
  lineageFactoryExists: /export const semanticDataflowFactWithLineage/.test(semantic),
  routeFactsCarryRouteLineage: /semanticDataflowFactWithLineage\([\s\S]*?'route'/.test(route),
  resourceFactsCarryResourceLineage: /semanticDataflowFactWithLineage\([\s\S]*?'resource'/.test(resource),
  queryFactsCarryControllerLineage: /semanticDataflowFactWithLineage\([\s\S]*?'controller'/.test(query),
  scannerFactsCarryControllerLineage: /semanticDataflowFactWithLineage\(canonical, 'controller'\)/.test(adapter),
  manifestStillComposesProducers: /semanticDataflowRouteParameterFacts/.test(manifest) && /semanticDataflowControllerFacts/.test(manifest) && /semanticDataflowControllerQueryFacts/.test(manifest),
  semanticFactKeyIgnoresLineage: /const factKey[\s\S]*semanticDataflowIdentityKey\(fact\.source\)[\s\S]*fact\.role/.test(authority) && !/const factKey = \(fact: SemanticDataflowFact\): string => JSON\.stringify\(fact\)/.test(authority),
  reachesRemainDerivedWithoutLineage: /const reachFact = \(source: SemanticDataflowIdentity, target: SemanticDataflowIdentity\)/.test(authority),
  noPolicyContributorAddedEarly: !/ConfigContributorInterface/.test(semantic + route + resource + query + manifest),
};

result.clean = Object.values(result).every(value => value === true);
console.log(JSON.stringify({ phase: 1022, ...result }, null, 2));
process.exitCode = result.clean ? 0 : 1;
