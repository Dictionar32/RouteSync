const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const productionFiles = dir => {
  const base = path.join(root, dir);
  const out = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith('.ts') && !full.includes(`${path.sep}__tests__${path.sep}`)) out.push(full);
    }
  };
  walk(base);
  return out;
};
const typeLowering = read('packages/core/src/compiler/domain/common/typeExpressionSemanticType.ts');
const relationalSequence = read('packages/core/src/semantic/kernel/relationalSequence.ts');
const staleTest = read('packages/core/src/semantic/__tests__/VerifiedModelGraph.phase87.47.test.ts');
const production = productionFiles('packages/core/src');
const legacyProduction = production.filter(file => /ParsedModel|ResourceFieldDescriptor/.test(fs.readFileSync(file, 'utf8')));
const checks = {
  variantRestExists: /export type RelationVariantRest/.test(relationalSequence) && /export const relationVariantRest/.test(relationalSequence),
  variantFoldCarriesRestWitness: /absentBranch: \(candidate: RelationVariantRest<T, K>\)/.test(relationalSequence),
  loweringUsesSemanticVariantFold: /relationVariantFold\(type, 'primitive', lowerNonPrimitiveType, lowerPrimitive\)/.test(typeLowering),
  loweringNoCasts: !/\bas unknown\b|\bas any\b/.test(typeLowering),
  staleParsedModelTestRetired: staleTest.trim().length === 0,
  legacyProductionReferencesZero: legacyProduction.length === 0,
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = {
  phase: 728,
  checks,
  retiredFiles: ['packages/core/src/semantic/__tests__/VerifiedModelGraph.phase87.47.test.ts'],
  legacyProductionReferences: legacyProduction.map(file => path.relative(root, file)),
  failed,
  pass: failed.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
