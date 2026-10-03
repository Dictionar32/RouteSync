const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const boundAst = fs.readFileSync(path.join(root, 'packages/core/src/types/domain/boundAst.ts'), 'utf8');
const eloquentVocabulary = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/modelVocabulary.ts'), 'utf8');
const forbidden = {
  if: /\bif\s*\(/g,
  for: /\bfor\s*\(/g,
  while: /\bwhile\s*\(/g,
  switch: /\bswitch\s*\(/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  null: /\bnull\b/g,
  strictEquality: /===/g,
  asUnknown: /\bas\s+unknown\b/g,
  any: /\bany\b/g,
  new: /\bnew\s+/g,
};
const counts = Object.fromEntries(Object.entries(forbidden).map(([k, re]) => [k, (boundAst.match(re) || []).length]));
const checks = {
  relationNodeUsesCanonicalEloquentType: /readonly relationType: EloquentRelationType;/.test(boundAst),
  factoryPreservesCanonicalRelationType: /relationType: params\.relationType,/.test(boundAst),
  noDuplicateBoundRelationKind: !/BoundRelationKind/.test(boundAst),
  noRelationConversionAdapter: !/toBoundRelationKind/.test(boundAst),
  canonicalEloquentRelationADT: /export type EloquentRelationType =/.test(eloquentVocabulary) && /readonly kind: 'has_many'/.test(eloquentVocabulary),
  noForbiddenConstructs: Object.values(counts).every(value => value === 0),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 714, kind: 'bound-ast-canonical-relation-adapter', checks, forbiddenConstructs: counts, pass: failed.length === 0, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
