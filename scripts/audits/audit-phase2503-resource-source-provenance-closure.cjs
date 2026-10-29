const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['resource field binding input requires upstream SourceFile', /readonly sourceFile: SourceFile/.test(read('packages/core/src/compiler/scanner/binders/resource/fieldBinder.ts'))],
  ['nested-array expression mapping consumes propagated sourceFile', /mapResourceAstExpression\(\{ value: entry\.value, sourceFile \}\)/.test(read('packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts'))],
  ['property-path resolution requires SourceFile', /resolvePropertyPath\(value: Member, rootModel: OriginModelSymbol, table: ModelSymbolTable, sourceFile: SourceFile\)/.test(read('packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts'))],
  ['method argument mapping consumes propagated sourceFile', /mapResourceAstExpression\(\{ value: argument\.value, sourceFile \}\)/.test(read('packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts'))],
  ['property-path binder propagates SourceFile', /resolvePropertyPath\(value, rootModel, table, sourceFile\)/.test(read('packages/core/src/compiler/scanner/binders/resource/propertyPathBinder.ts'))],
  ['public SemanticResourceBinder entry requires SourceFile', /readonly sourceFile: SourceFile/.test(read('packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts'))],
  ['inline response detector requires source identity', /actionName: string, sourceFile: SourceFile/.test(read('packages/core/src/compiler/scanner/operations/controller/responseDetector.ts'))],
  ['inline response mapping consumes propagated sourceFile', /mapResourceAstExpression\(\{ value: entry\.value, sourceFile \}\)/.test(read('packages/core/src/compiler/scanner/operations/controller/responseDetector.ts'))],
  ['no synthetic scanner provenance remains in active scanner source', !fs.readdirSync(path.join(root, 'packages/core/src/compiler/scanner'), { recursive: true }).filter(item => typeof item === 'string' && item.endsWith('.ts')).some(item => /createSourceFile\(['"]<scanner>['"]\)|sourceFile:\s*['"]<scanner>['"]/.test(read(path.join('packages/core/src/compiler/scanner', item))))],
  ['inline response provenance uses the real SourceFile identity', !read('packages/core/src/compiler/scanner/operations/controller/responseDetector.ts').includes("sourceFilePath('<inline>')") && /sourceFilePath\(sourceFile\.value\.value\)/.test(read('packages/core/src/compiler/scanner/operations/controller/responseDetector.ts'))],
  ['operation adapter still delegates through upstream authority', /export const mapResourceAstExpression:\s*ResourceAstExpressionMappingOperationInterface<PhpAstValue>/.test(read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts')) && /resourceAstExpressionMappingAuthority\.map\(input\)/.test(read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed).length;
console.log(`Result: ${checks.length - failures}/${checks.length} assertions passed`);
process.exitCode = failures ? 1 : 0;
