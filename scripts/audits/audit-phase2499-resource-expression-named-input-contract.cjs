const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts');
const mapper = read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts');
const barrel = read('packages/core/src/index.ts');
const consumers = [
  'packages/core/src/compiler/scanner/operations/resourceProducer.ts',
  'packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/responseDetector.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts',
].map(read);
const checks = [
  ['input is a named upstream contract', /export interface ResourceAstExpressionMappingInput<SyntaxValue>/.test(contract)],
  ['input carries typed SourceFile provenance', /readonly sourceFile: SourceFile/.test(contract)],
  ['operation accepts only the named input object', /\(input: ResourceAstExpressionMappingInput<SyntaxValue>\): ResourceExpressionModel/.test(contract)],
  ['operation implementation is export const typed by existing interface', /export const mapResourceAstExpression:\s*ResourceAstExpressionMappingOperationInterface<PhpAstValue>\s*=\s*input\s*=>/.test(mapper)],
  ['operation delegates named input to the upstream authority', /resourceAstExpressionMappingAuthority\.map\(input\)/.test(mapper)],
  ['all known external consumers use named input objects', consumers.every(source => source.includes('mapResourceAstExpression({'))],
  ['old positional operation name is no longer referenced in production source', !fs.readdirSync(path.join(root, 'packages/core/src'), { recursive: true }).filter(name => String(name).endsWith('.ts')).some(name => read(path.join('packages/core/src', String(name))).includes('resolveAstValueToExpression'))],
  ['upstream contract imports no scanner or relation/foundation modules', !/compiler\/scanner|semantic\/(relations|foundation)/.test(contract)],
  ['input contract is publicly exported', barrel.includes('ResourceAstExpressionMappingInput, ResourceAstExpressionMappingOperationInterface')],
  ['relation dependency is disclosed at the upstream authority boundary', /semantic\/relations/.test(read('packages/core/src/compiler/scanner/lexer/routeAst/resourceExpressionSemanticAuthority.ts')) && !/semantic\/relations/.test(mapper)],
];
let failed = 0;
for (const [label, passed] of checks) { console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`); failed += Number(!passed); }
console.log(`Result: ${checks.length - failed}/${checks.length} assertions passed`);
if (failed) process.exitCode = 1;
