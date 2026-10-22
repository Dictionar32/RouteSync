const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const operationPath = 'packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts';
const authorityPath = 'packages/core/src/compiler/scanner/lexer/routeAst/resourceExpressionSemanticAuthority.ts';
const contractPath = 'packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts';
const operation = read(operationPath);
const authority = read(authorityPath);
const contract = read(contractPath);
const publicIndex = read('packages/core/src/index.ts');
const astAlgebra = read('packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts');
const binaryContract = read('packages/core/src/types/upstream/resourceBinaryOperatorInterface.ts');
const binaryAuthority = read('packages/core/src/compiler/semantic/resourceBinaryOperatorAuthority.ts');
const checks = [
  ['existing mapping operation interface remains the runtime operation contract', /export interface ResourceAstExpressionMappingOperationInterface<SyntaxValue>/.test(contract)],
  ['upstream now defines a distinct semantic-authority contract because the owner was missing', /export interface ResourceAstExpressionMappingAuthorityInterface<SyntaxValue>/.test(contract)],
  ['authority contract accepts the existing named input and returns ResourceExpressionModel', /map:\s*\(input: ResourceAstExpressionMappingInput<SyntaxValue>\) => ResourceExpressionModel/.test(contract)],
  ['authority implementation is owned by the PHP route-AST frontend, not operations or subscanners', exists(authorityPath) && !exists('packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts')],
  ['authority implementation is typed by the upstream authority interface', /resourceAstExpressionMappingAuthority:\s*ResourceAstExpressionMappingAuthorityInterface<PhpAstValue>/.test(authority)],
  ['runtime-facing operation is export const typed by the existing operation interface', /export const mapResourceAstExpression:\s*ResourceAstExpressionMappingOperationInterface<PhpAstValue>/.test(operation)],
  ['runtime-facing operation only delegates and contains no semantic relation/foundation imports', /resourceAstExpressionMappingAuthority\.map\(input\)/.test(operation) && !/semantic\/(?:relations|foundation)/.test(operation)],
  ['authority accepts the named typed SourceFile input', /input: ResourceAstExpressionMappingInput<PhpAstValue>/.test(authority) && /input\.sourceFile\.value\.value/.test(authority)],
  ['authority has no synthetic scanner provenance fallback', !authority.includes("'<scanner>'") && !/sourceFile\s*=/.test(authority)],
  ['recursive expression projection requires and propagates source identity', /mapAstValueToExpression = \(value: PhpAstValue, sourceFile: string\)/.test(authority) && !/mapAstValueToExpression\([^,()]+\)/.test(authority)],
  ['authority contains no semantic foundation import', !/semantic\/foundation/.test(authority)],
  ['remaining relation dependency is disclosed at the authority boundary', /semantic\/relations/.test(authority)],
  ['authority contract is exported through the public core entry', /ResourceAstExpressionMappingAuthorityInterface/.test(publicIndex)],
  ['array-key and static-property-owner source ADTs have exhaustive eliminators', /export function matchPhpArrayKey/.test(astAlgebra) && /export function matchPhpStaticPropertyOwner/.test(astAlgebra) && authority.includes('matchPhpArrayKey') && authority.includes('matchPhpStaticPropertyOwner')],
  ['binary operator contract matches emitted PHP AST source-kind names', /ResourceBinaryOperatorSourceKind/.test(binaryContract) && /greater_or_equal:/.test(binaryAuthority) && /less_or_equal:/.test(binaryAuthority)],
  ['all known consumers remain wired to the operation adapter', ['resourceProducer.ts','resourceFieldProducer.ts','resourceBinder.ts','propertyPathResolution.ts','collectionArrayBinders.ts','responseDetector.ts'].every(name => { const files = fs.readdirSync(path.join(root,'packages/core/src'), { recursive:true }).filter(item => String(item).endsWith(name)); return files.some(file => read(path.join('packages/core/src',String(file))).includes('resourceAstExpressionMapper')); })],
];
let failed = 0;
for (const [label, passed] of checks) { console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`); failed += Number(!passed); }
console.log(`Result: ${checks.length - failed}/${checks.length} assertions passed`);
if (failed) process.exitCode = 1;
