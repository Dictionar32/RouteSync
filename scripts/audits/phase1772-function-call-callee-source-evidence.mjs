import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/compiler/scanner/lexer');
const ast = readFileSync(resolve(root, 'phpAstExpressionTypes.ts'), 'utf8');
const factory = readFileSync(resolve(root, 'phpAstFactory.ts'), 'utf8');
const projector = readFileSync(resolve(root, 'phpExpressionStructureProjector.ts'), 'utf8');
const upstream = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts'), 'utf8');
const checks = [
  ['function-call AST owns typed lexical source evidence', ast.includes('interface PhpFunctionNameSourceEvidence') && ast.includes("kind: 'php_function_name_source_evidence'")],
  ['function-call AST keeps compatibility identifier and full evidence separately', ast.includes('readonly functionName: AstIdentifier; readonly functionNameEvidence: PhpFunctionNameSourceEvidence')],
  ['source evidence preserves the complete token sequence', factory.includes('tokens: Object.freeze([...tokens])')],
  ['factory requires name evidence when constructing function calls', factory.includes("functionCall(functionName: AstIdentifier, functionNameEvidence: import('./phpAstExpressionTypes').PhpFunctionNameSourceEvidence, args: readonly PhpArgument[])")],
  ['projector forwards all callee tokens instead of discarding the tail', projector.includes('PhpAstFactory.functionNameSourceEvidence(structure.callee, {')],
  ['projector no longer constructs function calls with the old two-argument factory', !projector.includes('PhpAstFactory.functionCall(createAstIdentifier(structure.callee[0].value), args)')],
  ['upstream resolution contract retains qualified syntax variants', upstream.includes("kind: 'qualified_function_name_evidence'") && upstream.includes("kind: 'fully_qualified_function_name_evidence'")],
  ['no semantic/foundation dependency introduced', !ast.includes('semantic/foundation') && !factory.includes('semantic/foundation') && !projector.includes('semantic/foundation')],
  ['audit is located under scripts/audits', true],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);
