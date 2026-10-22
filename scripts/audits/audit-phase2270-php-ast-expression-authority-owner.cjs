const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
const canonical = 'packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSemanticAuthority.ts';
const mappings = 'packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionMappings.ts';
const closure = 'packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionClosure.ts';
const authority = read(canonical);
const runtimeBinding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const dependencyProjection = read('packages/core/src/compiler/scanner/wiring/controllerDependencyEvidenceProjection.ts');
const retired = [
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionClosure.ts',
].map(read);
const production = [
  'packages/core/src/compiler/scanner/operations/expressionProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/controllerRuntimeReturnProjection.ts',
  'packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts',
  'packages/core/src/compiler/scanner/wiring/controllerDependencyEvidenceProjection.ts',
].map(read).join('\n');
check('canonical PHP AST projection is owned by lexer/routeAst', fs.existsSync(path.join(root, canonical)) && authority.includes('export const phpAstExpressionSemanticAuthority'));
check('existing upstream authority interface is implemented', authority.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>'));
check('expression and statement projections have source-oriented names', authority.includes('projectPhpAstExpressionToUpstream') && authority.includes('projectPhpStatementsToSourceStatements'));
check('mapping helper is owned beside the PHP AST frontend', fs.existsSync(path.join(root, mappings)) && read(mappings).includes('export type UpstreamExpressionMapper'));
check('closure projection helper is owned beside the PHP AST frontend', fs.existsSync(path.join(root, closure)) && read(closure).includes('export function resolveClosureBody'));
check('former resource canonical modules are emptied rather than deleted', retired.every(source => source.trim().startsWith('// Retired:') && !/\b(export|function|class|const)\b/.test(source)));
check('production consumers point to the PHP frontend owner', !/subscanners\/resource\/(?:phpAstExpressionSemanticAuthority|phpAstExpressionMappings|phpAstExpressionClosure|resourceUpstreamExpressionCanonical)/.test(production));
check('controller runtime binding no longer imports resource-owned implementation', !runtimeBinding.includes('subscanners/resource') && runtimeBinding.includes('../lexer/routeAst/phpAstExpressionSemanticAuthority'));
check('dependency evidence uses the existing expression authority contract', dependencyProjection.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>') && dependencyProjection.includes('expressionAuthority'));
check('no semantic/foundation dependency was introduced', ![authority, read(mappings), read(closure), runtimeBinding, dependencyProjection].some(source => source.includes('semantic/foundation')));
check('no duplicate expression authority interface was introduced', !production.includes('PhpAstExpressionSemanticAuthorityInterfaceV2') && !production.includes('PhpAstExpressionAuthorityV2'));
check('canonical mapper uses the upstream resource mapping authority directly', read(mappings).includes('../../../../types/upstream/resourceSemanticMappingAuthority') && !read(mappings).includes('resourceSemanticMappingRelations'));
check('resource-specific adapter calls the canonical projection directly', read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts').includes('Upstream.projectPhpAstExpressionToUpstream') && !read('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts').includes("Upstream['projectPhpAstExpressionToUpstream']"));
const failed = checks.filter(({ passed }) => !passed);
for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
