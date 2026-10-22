const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
const resolverPath = 'packages/core/src/compiler/scanner/subscanners/resource/twoPassRelationResolver.ts';
const productionRoot = path.join(root, 'packages/core/src');
const productionFiles = [];
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (entry.isFile() && entry.name.endsWith('.ts')) productionFiles.push(absolute);
  }
};
visit(productionRoot);
const productionText = productionFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const legacyKnowledgePath = 'packages/core/src/compiler/scanner/subscanners/resource/resourceModelKnowledgeDataFlow.ts';
const authority = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/resourceModelKnowledgeDataFlowAuthority.ts'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/resourceModelKnowledgeDataFlowInterface.ts'), 'utf8');
const resolver = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts'), 'utf8');
const bindingContract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/resourceDefinitionBindingInterface.ts'), 'utf8');
check('two-pass relation resolver file is retired', !fs.existsSync(path.join(root, resolverPath)));
check('no production TypeScript import/reference points to retired resolver module', !productionText.includes('twoPassRelationResolver'));
check('orphaned resolver operations have no production TypeScript references', !/\b(resolveInitialModel|propagateRelationEdges)\b/u.test(productionText));
check('canonical knowledge operation contract remains upstream-owned', /interface ResourceModelKnowledgeDataFlowOperationsInterface/u.test(contract));
check('knowledge operation implementation remains typed by upstream interface', /resourceModelKnowledgeDataFlowOperations:\s*ResourceModelKnowledgeDataFlowOperationsInterface/u.test(authority));
check('current model resolver consumes the upstream-owned knowledge data type', /semantic\/resourceModelKnowledgeDataFlowAuthority/u.test(resolver));
check("legacy binder's optional knowledge input is not misrepresented as canonical scanner wiring", /knowledgeDataFlow\?: KnowledgeDataFlow/u.test(bindingContract) && !/ResourceDefinitionBindingOperationInterface/.test(fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts'), 'utf8')));
check('retired subscanner did not get relocated under another filename', !productionFiles.some(file => /twoPassRelationResolver/u.test(path.basename(file))));
for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\nResult: ${checks.filter(result => result.passed).length}/${checks.length} assertions passed`);
console.log('\nOpen frontiers:');
for (const file of [
  'packages/core/src/compiler/scanner/operations/resourceProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceFieldProducer.ts',
  'packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts',
]) {
  const absolute = path.join(root, file);
  if (fs.existsSync(absolute)) {
    const source = fs.readFileSync(absolute, 'utf8');
    console.log(`${/semantic\/(relations|foundation)/u.test(source) ? 'OPEN relation/foundation dependency' : 'CHECK owner migration'} ${file}`);
  }
}
if (checks.some(result => !result.passed)) process.exitCode = 1;
