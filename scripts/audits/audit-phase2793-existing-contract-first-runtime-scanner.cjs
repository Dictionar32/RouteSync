const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = 'packages/core/src/types/upstream/';
const contractFiles = {
  expressionAuthority: upstream + 'phpAstExpressionSemanticAuthorityInterface.ts',
  expressionOperation: upstream + 'expressionProducerInterface.ts',
  resourceMapping: upstream + 'resourceAstExpressionMappingInterface.ts',
  operator: upstream + 'scannerExpressionOperatorInterface.ts',
  pipeline: upstream + 'laravelSourceAstPipelineInterface.ts',
  manifest: upstream + 'manifestBuilderInterface.ts',
};
const contents = Object.fromEntries(Object.entries(contractFiles).map(([key, file]) => [key, read(file)]));
check('existing PHP AST semantic authority contract is inventoried before proposing new contracts', /PhpAstExpressionSemanticAuthorityInterface/.test(contents.expressionAuthority));
check('existing expression-from-PHP-AST operation contract is inventoried', /ExpressionFromPhpAstOperationInterface/.test(contents.expressionOperation));
check('existing resource mapping operation and authority contracts are inventoried', /ResourceAstExpressionMappingOperationInterface/.test(contents.resourceMapping) && /ResourceAstExpressionMappingAuthorityInterface/.test(contents.resourceMapping));
check('existing scanner expression operator contract is inventoried', /ScannerExpressionOperatorInterface/.test(contents.operator));
check('existing source-AST pipeline contract and projection judgment are inventoried', /LaravelSourceAstPipelineInterface/.test(contents.pipeline) && /LaravelSourceAstProjectionJudgment/.test(contents.pipeline));
check('existing manifest preparation/builder contracts and blocked ADT are inventoried', /ManifestBuilderOperationPreparationInterface/.test(contents.manifest) && /ManifestBuilderInterface/.test(contents.manifest) && /ManifestBuilderJudgment/.test(contents.manifest));
const doc = read(upstream + 'PHASE2793_EXISTING_CONTRACT_FIRST_RUNTIME_SCANNER_AUDIT.md');
check('runtime CLI-to-manifest trace is documented against existing contracts', /commands\/scan\.ts \/ sync\.ts/.test(doc) && /ManifestBuilderInterface\.build/.test(doc) && /LaravelSourceAstPipelineInterface\.execute/.test(doc));
check('contract-gap rule explicitly forbids premature new interfaces/ADTs', /adds\s+\*\*no new interface or ADT\*\*/.test(doc) && /document the gap before adding a new upstream contract/.test(doc));
const mapping = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionMappings.ts');
const closure = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionClosure.ts');
check('mapping runtime uses interface-typed frozen operation object and no exported free functions', /export const phpAstExpressionMappingOperations:\s*PhpAstExpressionMappingOperationsInterface\s*=\s*Object\.freeze\(/.test(mapping) && !/^export\s+function\s+/m.test(mapping));
check('closure runtime uses interface-typed frozen operation object and no exported free functions', /export const phpAstExpressionClosureOperations:\s*PhpAstExpressionClosureOperationsInterface\s*=\s*Object\.freeze\(/.test(closure) && !/^export\s+function\s+/m.test(closure));
check('mapping/closure implementations do not import generic relation utility helpers', !/from\s+['"][^'"]*semantic\/relations\//.test(mapping + '\n' + closure));
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
check('CLI scan and sync consume the injected manifest scan operation', /composition\.manifestScanOperation/.test(cliScan) && /composition\.manifestScanOperation/.test(cliSync));
check('intentionally empty upstream collections module remains 0 bytes', fs.statSync(path.join(root, upstream + 'collections.ts')).size === 0);
for (const result of checks) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\n${checks.filter(x => x.pass).length}/${checks.length} checks passed`);
if (checks.some(x => !x.pass)) process.exitCode = 1;
