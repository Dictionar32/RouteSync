const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/domain/expressions.ts');
const authority = read('packages/core/src/compiler/scanner/lexer/routeAst/resourceExpressionSemanticAuthority.ts');
const operation = read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts');
const contract = read('packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts');
const checks = [
  ['closure statement ADT explicitly represents unsupported while/switch/unset/include syntax', /kind: 'unsupported_statement'; readonly statementKind: 'while_statement' \| 'switch_statement' \| 'unset_statement' \| 'include_statement'/.test(model)],
  ['while projection returns a closed unsupported judgment instead of throwing', /while_statement: \(\) => \(\{ kind: 'unsupported_statement', statementKind: 'while_statement' \}\)/.test(authority)],
  ['switch projection returns a closed unsupported judgment instead of throwing', /switch_statement: \(\) => \(\{ kind: 'unsupported_statement', statementKind: 'switch_statement' \}\)/.test(authority)],
  ['unset projection returns a closed unsupported judgment instead of throwing', /unset_statement: \(\) => \(\{ kind: 'unsupported_statement', statementKind: 'unset_statement' \}\)/.test(authority)],
  ['include projection returns a closed unsupported judgment instead of throwing', /include_statement: \(\) => \(\{ kind: 'unsupported_statement', statementKind: 'include_statement' \}\)/.test(authority)],
  ['closure projection has no runtime throw for the four known unsupported statements', !/throw Error\('Resource closure authority does not yet model/.test(authority)],
  ['existing upstream authority contract remains the semantic authority boundary', /ResourceAstExpressionMappingAuthorityInterface/.test(contract) && /map:\s*\(input: ResourceAstExpressionMappingInput<SyntaxValue>\) => ResourceExpressionModel/.test(contract)],
  ['runtime-facing operation remains a typed export const adapter', /export const mapResourceAstExpression:\s*ResourceAstExpressionMappingOperationInterface<PhpAstValue>/.test(operation) && /resourceAstExpressionMappingAuthority\.map\(input\)/.test(operation)],
  ['adapter has no direct relation/foundation dependency', !/semantic\/(?:relations|foundation)/.test(operation)],
  ['remaining semantic relation debt is visible only at authority/other consumers, not hidden as fallback', /semantic\/relations/.test(authority) && !authority.includes("'<scanner>'")],
];
let failed = 0;
for (const [label, passed] of checks) { console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`); failed += Number(!passed); }
console.log(`Result: ${checks.length - failed}/${checks.length} assertions passed`);
if (failed) process.exitCode = 1;
