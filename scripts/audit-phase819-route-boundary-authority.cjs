const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(p, 'utf8');
const routeProducerRelations = read(path.join(core,'compiler/scanner/subscanners/routeProducerRelations.ts'));
const boundaryBasics = read(path.join(core,'compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts'));
const routeContracts = read(path.join(core,'compiler/scanner/descriptors/route/routeContracts.ts'));
const contractFactories = read(path.join(core,'compiler/scanner/descriptors/route/factories/contractRouteFactories.ts'));
const adapter = path.join(core,'compiler/scanner/resolvers/RouteBoundaryAdapter.ts');
const rootIndex = read(path.join(core,'index.ts'));
const upstreamRoute = read(path.join(core,'types/upstream/route.ts'));
const result = {
  phase: 819,
  routeProducerRelationsUsesLegacyFactory: /RouteSemanticFlowFactory/.test(routeProducerRelations),
  routeProducerRelationsUsesLegacyFlow: /RouteSemanticFlow/.test(routeProducerRelations),
  boundaryBasicsDependsOnDescriptorContracts: /descriptors\/route\/routeContracts/.test(boundaryBasics),
  canonicalBoundaryContractDefinedUpstream: /export interface RouteBoundaryContract/.test(upstreamRoute),
  legacyRouteContractsAliasesCanonicalBoundary: /type RouteSemanticFlowCompleteContracts = RouteBoundaryContract/.test(routeContracts),
  descriptorSparseFactoryUsesCanonicalBoundaryFactory: /RouteBoundaryContractFactory\.create/.test(contractFactories),
  legacyBoundaryAdapterExists: fs.existsSync(adapter),
  rootExportsLegacyBoundaryAdapter: /RouteBoundaryAdapter/.test(rootIndex),
};
result.nextFrontier = !result.routeProducerRelationsUsesLegacyFactory && !result.boundaryBasicsDependsOnDescriptorContracts && !result.legacyBoundaryAdapterExists
  ? 'audit RouteSemanticFlow consumers and eliminate remaining descriptor-only exports'
  : 'continue boundary cutover';
console.log(JSON.stringify(result, null, 2));
