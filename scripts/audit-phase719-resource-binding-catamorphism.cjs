const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/core/src/compiler/scanner/symbols/resource/resourceBindingTypes.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = {
  closedBindingUnion: /export type ResourceModelBinding\s*=\s*MonoModelBinding \| PolyModelBinding \| UnbackedDtoBinding/.test(source),
  variantOwnsFold: (source.match(/readonly fold: <R>\(visitor: ResourceModelBindingVisitor<R>\) => R;/g) || []).length === 3,
  catamorphicMatch: /return binding\.fold\(visitor\);/.test(source),
  monoFoldTyped: /visitor\.mono\(binding\)/.test(source),
  polyFoldTyped: /visitor\.poly\(binding\)/.test(source),
  dtoFoldTyped: /visitor\.unbacked_dto\(binding\)/.test(source),
  noRelationGateVariantNarrowing: !/relationGate\(|relationEqual\(binding\.kind/.test(source),
  noLegacyParsedBinding: !/ParsedResourceModelBinding|LegacyResourceModelBinding/.test(source),
  noAny: !/\bany\b/.test(source),
  noUnknownCast: !/as\s+unknown/.test(source),
  noNullish: !/\?\?|\bundefined\b|\bnull\b/.test(source),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 719, checks, pass: failed.length === 0, failed, trace: [
  'Laravel resource scan evidence',
  'ResourceModelBinding closed judgment',
  'variant-owned catamorphic fold',
  'resolver/model semantic projection',
  'resolver graph relation'
], suggestion: 'Next frontier: remove remaining host primitives from ResourceModelResolver and resourceBinder by lifting resource identity, diagnostic text, and projection facts into upstream semantic ADTs.' };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
