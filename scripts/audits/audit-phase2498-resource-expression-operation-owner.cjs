const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const mapperPath = 'packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts';
const mapper = read(mapperPath);
const interfaceSource = read('packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts');
const producer = read('packages/core/src/compiler/scanner/operations/resourceProducer.ts');
const field = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
const consumers = [
  'packages/core/src/compiler/scanner/operations/resourceProducer.ts',
  'packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/responseDetector.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts',
].map(read).join('\n');
const checks = [
  ['existing upstream mapping interface remains the operation contract', interfaceSource.includes('export interface ResourceAstExpressionMappingOperationInterface<SyntaxValue>')],
  ['mapping contract accepts a named syntax and source-identity input', interfaceSource.includes('interface ResourceAstExpressionMappingInput<SyntaxValue>') && interfaceSource.includes('readonly sourceFile: SourceFile')],
  ['canonical mapping operation is owned by scanner operations', exists(mapperPath) && !exists('packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts')],
  ['mapping operation uses export const with the existing interface', /export const mapResourceAstExpression:\s*ResourceAstExpressionMappingOperationInterface<PhpAstValue>/.test(mapper)],
  ['Resource producer calls the operation-owned mapper', producer.includes('from "./resourceAstExpressionMapper"')],
  ['field producer calls the operation-owned mapper', field.includes("from './resourceAstExpressionMapper'")],
  ['all active known consumers use the operation owner', consumers.includes('resourceAstExpressionMapper') && !consumers.includes('subscanners/resource/resourceAstExpressionMapper')],
  ['no production source imports the retired mapper path', !fs.readdirSync(path.join(root, 'packages/core/src'), { recursive: true }).filter(name => String(name).endsWith('.ts')).some(name => read(path.join('packages/core/src', String(name))).includes('subscanners/resource/resourceAstExpressionMapper'))],
  ['upstream mapper contract avoids semantic foundation', !/semantic\/foundation/.test(interfaceSource)],
  ['semantic relation dependency is visible in the upstream authority, not runtime operation', !mapper.includes('semantic/relations') && read('packages/core/src/compiler/scanner/lexer/routeAst/resourceExpressionSemanticAuthority.ts').includes('semantic/relations')],
  ['field semantic authority remains independent from relation and foundation modules', !/from\s+['"][^'"]*semantic\/(?:relations|foundation)\//.test(read('packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts'))],
];
let failed = 0;
for (const [label, passed] of checks) { console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`); failed += Number(!passed); }
console.log(`Result: ${checks.length - failed}/${checks.length} assertions passed`);
if (failed) process.exitCode = 1;
