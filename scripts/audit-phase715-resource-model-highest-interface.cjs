const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resolver = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts'), 'utf8');
const matcher = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/resource/structuralFieldMatcher.ts'), 'utf8');
const table = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts'), 'utf8');

const forbidden = source => ({
  if: (source.match(/\bif\b/g) || []).length,
  for: (source.match(/\bfor\b/g) || []).length,
  while: (source.match(/\bwhile\b/g) || []).length,
  switch: (source.match(/\bswitch\b/g) || []).length,
  map: (source.match(/\.map\s*\(/g) || []).length,
  filter: (source.match(/\.filter\s*\(/g) || []).length,
  reduce: (source.match(/\.reduce\s*\(/g) || []).length,
  flatMap: (source.match(/\.flatMap\s*\(/g) || []).length,
  undefined: (source.match(/\bundefined\b/g) || []).length,
  null: (source.match(/\bnull\b/g) || []).length,
  strictEquality: (source.match(/===/g) || []).length,
  asUnknown: (source.match(/\bas\s+unknown\b/g) || []).length,
  any: (source.match(/\bany\b/g) || []).length,
  new: (source.match(/\bnew\b/g) || []).length,
});

const files = { resolver, matcher, table, controller };
const checks = {
  resolverUsesCanonicalControllerOrigin: resolver.includes('findForControllerOrigin(binding.model)'),
  resolverUsesTypedPropertyNames: resolver.includes('readonly fieldNames: readonly PropertyName[];'),
  matcherUsesTypedPropertyNames: matcher.includes('fieldNames: readonly PropertyName[]'),
  matcherNoStringFieldContract: !/fieldNames:\s*readonly\s+string\[\]/.test(matcher),
  modelTableHasOriginLookup: table.includes('findForControllerOrigin'),
  controllerUsesUpstreamOrigin: controller.includes("import type { ControllerModelOrigin, ControllerVariableSemantic } from '../../../../types/upstream/controller';"),
  noLocalModelOriginDescriptor: !controller.includes('type ModelOriginCandidate'),
  noLegacyBoundAstDescriptor: !resolver.includes('BoundRelationKind'),
  noBuildErrorSignatures: !resolver.includes('binding.model.name'),
};
const forbiddenConstructs = Object.fromEntries(Object.entries(files).map(([name, source]) => [name, forbidden(source)]));
const pass = Object.values(checks).every(Boolean) && Object.values(forbiddenConstructs).every(item => Object.values(item).every(value => value === 0));
console.log(JSON.stringify({ phase: 715, kind: 'resource-model-highest-interface', checks, forbiddenConstructs, pass, failed: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key) }, null, 2));
process.exit(pass ? 0 : 1);
