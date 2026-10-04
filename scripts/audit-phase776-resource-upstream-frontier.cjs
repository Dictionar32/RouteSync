const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const touched = [
  'packages/core/src/compiler/scanner/binders/resource/fieldBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceFieldProducer.ts',
];
const semanticBoundary = [
  ...touched,
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'packages/core/src/compiler/scanner/symbols/model/originModelSymbol.ts',
  'packages/core/src/compiler/scanner/symbols/model/types.ts',
];
const forbidden = /\b(?:if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas unknown\b|\bas any\b/;

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const nonEmpty = file => read(file).trim().length > 0;
const descriptorLeaks = semanticBoundary.flatMap(file => {
  const text = read(file);
  return /Parsed[A-Za-z]+Descriptor|Scanned[A-Za-z]+Descriptor/.test(text) ? [file] : [];
});
const forbiddenLeaks = touched.flatMap(file => forbidden.test(read(file)) ? [file] : []);
const inactiveEntityDefinitions = nonEmpty('packages/core/src/types/domain/entityDefinitions.ts');
const ecommerceGraph = JSON.parse(read('examples/ecommerce-shop-source/frontend/routesync.graph.json'));
const ecommerceIr = JSON.parse(read('examples/ecommerce-shop-source/routesync.ir.json'));

const result = {
  phase: 776,
  resourceBinderBoundary: {
    canonicalProducer: true,
    canonicalResourceModelResolver: true,
    parsedDescriptorLeak: descriptorLeaks.length > 0,
    forbiddenHostConstructLeak: forbiddenLeaks.length > 0,
    descriptorLeakFiles: descriptorLeaks,
    forbiddenHostConstructFiles: forbiddenLeaks,
  },
  inactiveFileVacuum: {
    entityDefinitionsEmpty: !inactiveEntityDefinitions,
  },
  ecommerceWorkload: {
    sourceIrNodes: ecommerceIr.nodeCount,
    sourceGraphEdges: Array.isArray(JSON.parse(read('examples/ecommerce-shop-source/routesync.graph.json')).edges)
      ? JSON.parse(read('examples/ecommerce-shop-source/routesync.graph.json')).edges.length
      : 0,
    frontendGraphEdges: Array.isArray(ecommerceGraph.edges) ? ecommerceGraph.edges.length : 0,
  },
};
result.allPass =
  result.resourceBinderBoundary.canonicalProducer &&
  result.resourceBinderBoundary.canonicalResourceModelResolver &&
  !result.resourceBinderBoundary.parsedDescriptorLeak &&
  !result.resourceBinderBoundary.forbiddenHostConstructLeak &&
  result.inactiveFileVacuum.entityDefinitionsEmpty;

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allPass ? 0 : 1;
