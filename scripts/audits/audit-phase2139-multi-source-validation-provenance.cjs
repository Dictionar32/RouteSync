const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['domain RequestField publishes complete source collection', () => /readonly sources: readonly SourceSpan\[\]\s*;[\s\S]*?readonly source: SourceSpan/.test(read('packages/core/src/types/domain/request.ts'))],
  ['nested ValidationFieldProperty publishes complete source collection', () => /interface ValidationFieldProperty[\s\S]*?readonly sources: readonly SourceSpan\[\]\s*;/.test(read('packages/core/src/types/domain/validationRules.ts'))],
  ['root aggregation appends source evidence without replacing prior spans', () => /sources: Object\.freeze\(\[\.\.\.relationOptionFold\(existing, \(\) => \[\], value => value\.sources\), entry\.source\]\)/.test(read('packages/core/src/compiler/scanner/operations/domain-model/validation/validationRuleSet.ts'))],
  ['nested property merge retains sources from both contributing properties', () => /sources: Object\.freeze\(\[\.\.\.existing\.sources, \.\.\.incoming\.sources\]\)/.test(read('packages/core/src/compiler/scanner/operations/domain-model/validation/validationRuleSet.ts'))],
  ['RequestField projection carries multi-source provenance into upstream AST', () => (read('packages/core/src/compiler/scanner/operations/requestAstCanonical.ts').match(/sources: Object\.freeze\(\[\.\.\.fieldSource\.sources\]\)/g) || []).length === 2],
  ['upstream RequestField contract declares all contributing source spans', () => /export type RequestField = \{[^\n]*readonly sources: readonly SourceSpan\[\]\;/.test(read('packages/core/src/types/upstream/request.ts'))],
  ['schema emptiness accounts for validation evidence as well as projections', () => /schema\.fields\.length \+ schema\.messages\.length \+ schema\.attributes\.length \+ schema\.validationEntries\.length/.test(read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts'))],
  ['no new duplicate semantic authority was introduced', () => !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerValidationProvenanceAuthority.ts'))],
];
let failed = 0;
for (const [label, check] of checks) {
  let passed = false;
  try { passed = check(); } catch {}
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed += Number(!passed);
}
process.stdout.write(`Phase 2139 audit: ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
