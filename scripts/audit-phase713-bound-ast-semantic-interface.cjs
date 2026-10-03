const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/core/src/types/domain/boundAst.ts');
const source = fs.readFileSync(file, 'utf8');
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
const counts = Object.fromEntries(Object.entries(forbidden).map(([k, re]) => [k, (source.match(re) || []).length]));
const checks = {
  closedBoundSemanticNode: /export type BoundSemanticNode =/.test(source),
  canonicalUnsupportedNode: /export interface BoundUnsupportedNode/.test(source) && !/BoundUnknownNode/.test(source),
  canonicalSemanticMatcher: /export const matchBoundSemantic =/.test(source) && !/matchBoundSemanticNode/.test(source),
  relationDrivenDispatch: /relationRefine\(node, boundSemanticPredicates\.primitive\)/.test(source),
  relationDrivenAvailability: /relationRefine\(availability, isAlwaysPresent\)/.test(source),
  canonicalEloquentRelationInterface: /readonly relationType: EloquentRelationType;/.test(source) && /relationType: params\.relationType,/.test(source) && !/toBoundRelationKind/.test(source),
  noLegacyAliases: !/BoundUnknownNode|matchBoundSemanticNode/.test(source),
  noForbiddenConstructs: Object.values(counts).every(value => value === 0),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 713, kind: 'bound-ast-highest-semantic-interface', checks, forbiddenConstructs: counts, pass: failed.length === 0, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
