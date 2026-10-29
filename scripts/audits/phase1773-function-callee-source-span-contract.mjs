import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/compiler/frontend/php');
const ast = readFileSync(resolve(root, 'phpAstExpressionTypes.ts'), 'utf8');
const factory = readFileSync(resolve(root, 'phpAstFactory.ts'), 'utf8');
const projector = readFileSync(resolve(root, 'phpExpressionStructureProjector.ts'), 'utf8');
const resolver = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts'), 'utf8');
const resourceMapper = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts'), 'utf8');
const checks = [
  ['callee evidence has a typed source-range contract', ast.includes('readonly source: SourceRange;') && ast.includes('Span of the callee itself')],
  ['callee evidence retains all source tokens', ast.includes('readonly tokens: readonly TokenDescriptor[];')],
  ['factory requires a source range when constructing callee evidence', factory.includes('functionNameSourceEvidence(tokens: readonly TokenDescriptor[], source: SourceRange)')],
  ['projector records the first callee token start', projector.includes('startOffset: createSourceOffset(structure.callee[0].startOffset)')],
  ['projector records the final callee token end', projector.includes('endOffset: createSourceOffset(structure.callee[structure.callee.length - 1].endOffset)')],
  ['projector forwards the entire callee token sequence', projector.includes('functionNameSourceEvidence(structure.callee, {')],
  ['upstream contract retains qualified and fully-qualified syntax judgments', resolver.includes("kind: 'qualified_function_name_evidence'") && resolver.includes("kind: 'fully_qualified_function_name_evidence'")],
  ['legacy resource mapper remains identified as a consumer requiring migration', resourceMapper.includes('phpFunctionCallSemanticAuthority.derive')],
  ['no semantic/foundation dependency introduced', !ast.includes('semantic/foundation') && !factory.includes('semantic/foundation') && !projector.includes('semantic/foundation')],
  ['audit is located under scripts/audits', true],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);
