const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['resource producer consumes upstream mapper operation', read('packages/core/src/compiler/scanner/operations/resourceProducer.ts').includes('mapResourceAstExpression({ value, sourceFile })')],
  ['resource producer assignment target preserves canonical SourceFile', read('packages/core/src/compiler/scanner/operations/resourceProducer.ts').includes('resolveAssignmentTarget(statement.target, value => mapResourceAstExpression({ value, sourceFile }).upstream, sourceFile.value.value)')],
  ['resource producer no longer recreates SourceFile during assignment projection', !read('packages/core/src/compiler/scanner/operations/resourceProducer.ts').includes('resolveAssignmentTarget(statement.target, (value, file) => mapResourceAstExpression({ value, sourceFile: createSourceFile(file) })')],
  ['resource binder assignment target preserves canonical SourceFile', read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts').includes('resolveAssignmentTarget(target, value => mapResourceAstExpression({ value, sourceFile }).upstream, sourceFile.value.value)')],
  ['resource binder no longer recreates SourceFile during assignment projection', !read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts').includes('createSourceFile(')],
  ['mapper accepts named provenance-bearing input', read('packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts').includes('ResourceAstExpressionMappingInput<SyntaxValue>')],
  ['mapper input explicitly carries SourceFile', read('packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts').includes('readonly sourceFile: SourceFile;')],
  ['mapper operation delegates to existing semantic authority', read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts').includes('resourceAstExpressionMappingAuthority.map(input)')],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, pass]) => pass).length}/${checks.length} assertions passed`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
