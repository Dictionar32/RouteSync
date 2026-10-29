const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const relationImportPattern = /from\s*['\"]([^'\"]*semantic\/relations\/(relationMembership|relationalSequence|semanticRelations))['\"]/g;
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });
const irLowering = read('packages/core/src/compiler/ir/semanticIRLoweringRelations.ts');
const buildIr = read('packages/core/src/ir/buildIRNode.ts');
const resolvedFactory = read('packages/core/src/types/ir/resolvedSemanticFactory.ts');
const response = read('packages/core/src/types/upstream/response.ts');
const normalizer = read('packages/core/src/compiler/generators/contract-generation/response-field/typeNormalizer.ts');
const wrapper = read('packages/core/src/compiler/domain/common/response-lowering/mapper/wrapperResolver.ts');
check('IR lowering owns typed rule model', /interface IRLoweringRule\s*\{/.test(irLowering));
check('IR lowering lookup is explicit judgment ADT', /ir_lowering_rule_found/.test(irLowering) && /ir_lowering_rule_missing/.test(irLowering) && /continueWith/.test(irLowering));
check('IR lowering runtime entry is interface-typed object export', /export const irLoweringOperations:\s*IRLoweringOperationsInterface\s*=\s*Object\.freeze/.test(irLowering));
check('IR lowering has no deleted relation foundation imports', !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations|semanticRewriteEngine)/.test(irLowering));
check('IR node projection delegates to semantic field-set operation', /value\.fields\.names\(\)/.test(buildIr) && !/semantic\/relations\//.test(buildIr));
check('IR node runtime constructors use explicit callable interfaces', /export const computeStableHash:\s*ComputeStableHashInterface/.test(buildIr) && /export const buildSemanticIRNode:\s*BuildSemanticIRNodeInterface/.test(buildIr));
check('resolved semantic factory has explicit interface', /export const ResolvedSemanticTypeFactory:\s*ResolvedSemanticTypeFactoryInterface\s*=\s*Object\.freeze/.test(resolvedFactory));
check('response cardinality continuation is domain-owned', /ResponseCardinalityOperationsInterface/.test(response) && /responseCardinalityOperations/.test(resolvedFactory));
check('IR lowering consumers call domain operations', /irLoweringOperations\.resolve/.test(normalizer) && /irLoweringOperations\.resolve/.test(wrapper));
check('obsolete collection interface file remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0);
const failures = checks.filter((item) => !item.passed);
const relationImportFiles = new Set();
let relationImportLines = 0;
for (const relative of ['packages/core/src', 'packages/cli/src']) {
  const walk = (directory) => {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const source = read(child);
        for (const match of source.matchAll(relationImportPattern)) {
          relationImportLines += 1;
          relationImportFiles.add(child);
        }
      }
    }
  };
  walk(relative);
}
const result = { phase: 2976, title: 'Runtime IR Domain Ownership', passed: checks.length - failures.length, total: checks.length, checks, remainingDeletedFoundationImports: { importLines: relationImportLines, files: relationImportFiles.size }, knownScopeLimit: 'This audit covers the IR lowering and adjacent IR construction slice, not the complete upstream/CLI/manifest import graph.' };
fs.writeFileSync(path.join(root, 'PHASE2976_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`\n${result.passed}/${result.total} checks passed`);
if (failures.length) process.exitCode = 1;
