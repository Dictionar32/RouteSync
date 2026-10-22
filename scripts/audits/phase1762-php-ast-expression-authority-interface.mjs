import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname);
const contractPath = join(root, 'packages/core/src/types/upstream/phpAstExpressionSemanticAuthorityInterface.ts');
const indexPath = join(root, 'packages/core/src/types/upstream/index.ts');
const producerPath = join(root, 'packages/core/src/compiler/scanner/subscanners/expressionProducer.ts');
const mapperPath = join(root, 'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts');
const contract = readFileSync(contractPath, 'utf8');
const index = readFileSync(indexPath, 'utf8');
const producer = readFileSync(producerPath, 'utf8');
const mapper = readFileSync(mapperPath, 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

check('upstream authority interface exists', contract.includes('interface PhpAstExpressionSemanticAuthorityInterface'));
check('upstream contract keeps PHP AST evidence generic', contract.includes('PhpAstExpressionSemanticInput<Evidence>') && !contract.split('\n').some(line => line.startsWith('import ') && line.includes('compiler/scanner')));
check('judgment reuses canonical closed Expression ADT', contract.includes('type PhpAstExpressionSemanticJudgment = Expression'));
check('contract exports source evidence and class context as domain types', contract.includes('sourceFile: SourceFile') && contract.includes('classContext: Option<PhpTypeClassContext>'));
check('upstream barrel exports the authority contract', index.includes("export * from './phpAstExpressionSemanticAuthorityInterface';"));
check('resource mapper implements the upstream interface', mapper.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>') && mapper.includes("kind: 'php_ast_expression_semantic_authority'"));
check('shared expression producer invokes the authority contract', producer.includes('resourcePhpAstExpressionSemanticAuthority.derive') && producer.includes("kind: 'php_ast_expression_evidence'"));
check('shared expression producer no longer imports mapper function directly', !producer.includes('mapResourcePhpAstToUpstream'));

const scanFiles = directory => readdirSync(directory).flatMap(name => {
  const path = join(directory, name);
  return statSync(path).isDirectory() ? scanFiles(path) : path.endsWith('.ts') ? [path] : [];
});
const scannerFiles = scanFiles(join(root, 'packages/core/src/compiler/scanner'));
const directConsumers = scannerFiles.filter(path => readFileSync(path, 'utf8').includes('mapResourcePhpAstToUpstream') && path !== mapperPath);
check('remaining direct mapper consumers are visible for staged migration', directConsumers.length > 0);

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`INFO remaining scanner files referencing mapper: ${directConsumers.length}`);
console.log(`RESULT ${checks.filter(item => item.passed).length}/${checks.length}`);
if (checks.some(item => !item.passed)) process.exitCode = 1;
