const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const basics = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const resolution = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const provenance = read('packages/core/src/compiler/scanner/resolvers/boundary/provenanceBuilder.ts');
const factory = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts');

const emptyLegacy = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts'
];

const checks = {
  resolvedSourceLineIsNominal: /readonly sourceLine:\s*import\("\.\.\/\.\.\/\.\.\/\.\.\/types\/route"\)\.RouteProvenanceContract\["sourceLine"\]/.test(basics),
  rawLineCanonicalizedAtBoundary: /sourceLine:\s*numberValue\(params\.sourceLine\)/.test(resolution),
  provenanceConsumesCanonicalLine: /sourceLine:\s*params\.sourceLine/.test(provenance) && !/numberValue\(params\.sourceLine\)/.test(provenance),
  factoryConsumesResolvedAuthority: /buildRouteProvenanceContract\(resolved\)/.test(factory),
  parsedDescriptorReservoirsEmpty: emptyLegacy.every((p) => exists(p) && fs.statSync(path.join(root,p)).size === 0),
  noPrimitiveSourceLineInResolved: !/readonly sourceLine:\s*number;/.test(basics)
};

const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({ phase: 761, model: 'highest-boundary-provenance-judgment', checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
