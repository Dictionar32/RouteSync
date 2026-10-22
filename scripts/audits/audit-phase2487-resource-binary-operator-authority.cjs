const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contractPath = 'packages/core/src/types/upstream/resourceBinaryOperatorInterface.ts';
const authorityPath = 'packages/core/src/compiler/semantic/resourceBinaryOperatorAuthority.ts';
const mapperPath = 'packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts';
const contract = read(contractPath);
const authority = read(authorityPath);
const mapper = read(mapperPath);
const resourceAuthority = read('packages/core/src/compiler/scanner/lexer/routeAst/resourceExpressionSemanticAuthority.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const coreBarrel = read('packages/core/src/index.ts');
const semanticValues = read('packages/core/src/types/domain/semanticValues.ts');

check('Binary operator mapping has a named upstream operation interface', contract.includes('export interface ResourceBinaryOperatorMappingOperationInterface'));
check('Upstream operation contract owns a closed source-operator kind union without importing scanner AST', /export type ResourceBinaryOperatorSourceKind =/.test(contract) && !/semantic\/(relations|foundation)/.test(contract) && !/compiler\/scanner/.test(contract));
check('Semantic authority is exported as an interface-typed const operation', authority.includes('export const resourceBinaryOperatorMapping: ResourceBinaryOperatorMappingOperationInterface'));
check('Authority has an exhaustive typed judgment table for every emitted Laravel PHP operator kind', /Readonly<Record<ResourceBinaryOperatorSourceKind, SemanticOperator\['value'\]>>/.test(authority) && ['addition','subtraction','multiplication','division','modulo','equal','not_equal','identical','not_identical','less_than','greater_than','less_or_equal','greater_or_equal','logical_and','logical_or','bitwise_or','concat'].every(kind => new RegExp(`\\b${kind}:`).test(authority)));
check('Unsupported emitted binary operators have an explicit semantic unknown value', authority.includes("bitwise_or: 'unknown'") && semanticValues.includes("| 'unknown';"));
check('Resource AST mapper consumes the upstream-owned authority operation', resourceAuthority.includes("from '../../../semantic/resourceBinaryOperatorAuthority'") && resourceAuthority.includes('resourceBinaryOperatorMapping.map(v.operator.kind)'));
check('Legacy subscanner operator mapper is retired', !exists('packages/core/src/compiler/scanner/subscanners/resource/resourceExpressionOperator.ts') && !mapper.includes('resourceExpressionOperator'));
check('Upstream barrel exports the new contract', upstreamBarrel.includes("export * from './resourceBinaryOperatorInterface';"));
check('Public core barrel exports the contract and operation', coreBarrel.includes('ResourceBinaryOperatorMappingOperationInterface') && coreBarrel.includes('resourceBinaryOperatorMapping'));
check('New authority and contract do not import semantic relations or foundation', !/semantic\/(relations|foundation)/.test(authority + contract));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter(result => result.passed).length;
process.stdout.write(`\n${passed}/${checks.length} assertions passed.\n`);
if (passed !== checks.length) process.exitCode = 1;
