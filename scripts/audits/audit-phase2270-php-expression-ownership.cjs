const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const scanner = path.join(root, 'packages/core/src/compiler/scanner');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const allTypeScript = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? allTypeScript(full) : entry.name.endsWith('.ts') ? [full] : [];
});
const sourceFiles = allTypeScript(scanner);
const sourceText = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const legacyPaths = [
  'resourceUpstreamExpressionCanonical',
  'resourceUpstreamExpressionMappings',
  'resourceUpstreamExpressionClosure',
];
const legacyModules = legacyPaths.map(name => path.join(scanner, 'subscanners/resource', `${name}.ts`));
const check = (name, condition) => {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${name}\n`);
  return condition;
};
let passed = 0;
let failed = 0;
const run = (name, condition) => condition ? (passed += 1, check(name, true)) : (failed += 1, check(name, false));

const canonical = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSemanticAuthority.ts');
const mappings = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionMappings.ts');
const closure = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionClosure.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const returnProjection = read('packages/core/src/compiler/scanner/lexer/routeAst/controllerRuntimeReturnProjection.ts');
const dependencyProjection = read('packages/core/src/compiler/scanner/wiring/controllerDependencyEvidenceProjection.ts');

run('existing upstream expression authority interface remains the contract', canonical.includes("import type { PhpAstExpressionSemanticAuthorityInterface } from '../../../../types/upstream/phpAstExpressionSemanticAuthorityInterface'"));
run('canonical implementation is owned by PHP route AST frontend', canonical.includes('export const phpAstExpressionSemanticAuthority') && canonical.includes('export function projectPhpAstExpressionToUpstream'));
run('shared expression mappings are owned beside the PHP AST frontend', mappings.includes("from '../../../../types/upstream/resourceSemanticMappingAuthority'") && !mappings.includes('subscanners/resource'));
run('shared closure projection is owned beside the PHP AST frontend', closure.includes("from './phpAstExpressionMappings'") && !closure.includes('subscanners/resource'));
run('controller runtime binding imports the canonical authority', binding.includes("from '../lexer/routeAst/phpAstExpressionSemanticAuthority'") && !binding.includes('subscanners/resource'));
run('controller return projection uses the canonical AST projector', returnProjection.includes("from './phpAstExpressionSemanticAuthority'") && !returnProjection.includes('subscanners/resource'));
run('dependency evidence receives the existing expression authority', dependencyProjection.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>') && dependencyProjection.includes('input.expressionAuthority.derive'));
run('no scanner consumer imports former resource-owned implementation modules', !sourceText.split('\n').some(line => /from\s+['"][^'"]*resourceUpstreamExpression(?:Canonical|Mappings|Closure)['"]/.test(line)));
run('former resource canonical module is empty', legacyModules.every(file => !/\b(?:export\s+)?(?:function|class|const|let|var|import)\b/.test(fs.readFileSync(file, 'utf8'))));
run('no parallel expression authority or generic wrapper was introduced', !sourceText.includes('ControllerDependencySourceEvidenceProjectionInterface') && !sourceText.includes('PhpAstExpressionSemanticAuthorityInterfaceV2'));
run('no semantic/foundation import in expression ownership files', ![canonical, mappings, closure, binding, returnProjection, dependencyProjection].some(source => source.includes('semantic/foundation')));
run('all former mapper operation names were migrated', !sourceText.includes('mapResourcePhpAstToUpstream') && !sourceText.includes('mapResourcePhpStatementsToSourceStatements') && !sourceText.includes('resourcePhpAstExpressionSemanticAuthority'));

process.stdout.write(`\nPhase 2270 expression ownership audit: ${passed}/12 passed, ${failed} failed.\n`);
process.exitCode = failed === 0 ? 0 : 1;
