const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const parser = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/route-scanner/routePathParser.ts'), 'utf8');
const relations = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts'), 'utf8');
const basics = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts'), 'utf8');
const checks = {
  resolvedRoutePathCarriesRuntimePath: /readonly runtimePath: RoutePath/.test(parser),
  resolvedRoutePathCarriesConstantKey: /readonly constantKey: string/.test(parser),
  parserProducesRuntimePath: /const runtimePath = createRoutePath\(normalizedPath\.replace/.test(parser),
  parserUsesCanonicalConstantKeyDerivation: /deriveRouteConstantKey\(path\)/.test(parser),
  emissionProjectsRuntimePath: /runtimePath: emission\.path\.runtimePath/.test(relations),
  emissionProjectsConstantKey: /constantKey: SemanticValueFactory\.propertyName\(emission\.path\.constantKey\)/.test(relations),
  boundaryStillAcceptsUpstreamProjection: /resolvedRuntimePath.*boundaryPresence\(input\.runtimePath\)/s.test(basics),
  boundaryNoDuplicatePathDerivationInEmission: !/deriveRouteConstantKey\(emission\.path\.path\)/.test(relations),
};
const pass = Object.values(checks).every(Boolean);
const report = { phase: 879, audit: 'upstream-path-authority', checks, pass };
fs.writeFileSync(path.join(root, 'scripts/audits/phase879-upstream-path-authority.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
