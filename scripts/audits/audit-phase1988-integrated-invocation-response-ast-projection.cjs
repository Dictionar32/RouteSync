const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
const bodyTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const bodyParser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const test = read('packages/core/src/types/upstream/__test__/laravelControllerAstProjectionSemanticAuthority.phase1952.test.ts');
const publicIndex = read('packages/core/src/index.ts');
const controllerScannerRoot = path.join(root, 'packages/core/src/compiler/scanner/operations/controller');
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
};
walk(controllerScannerRoot);
const relationFiles = files.filter(file => fs.readFileSync(file, 'utf8').includes('semantic/relations')).length;
const foundationFiles = files.filter(file => fs.readFileSync(file, 'utf8').includes('semantic/foundation')).length;
check('existing invocation-only context is explicitly discriminated', contract.includes("readonly kind: 'invocation_semantic_judgment';") && contract.includes("readonly kind: 'invocation_only_projection';"));
check('integrated context requires both correlated judgments', contract.includes("readonly kind: 'integrated_invocation_response_judgment';") && contract.includes('readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>;'));
check('projection ADT separates syntax, invocation-only, and integrated outcomes', contract.includes("readonly kind: 'syntax_only_projection';") && contract.includes("readonly kind: 'invocation_only_projection';") && contract.includes("readonly kind: 'semantic_projection';"));
check('AST projection authority forwards the exact response judgment', authority.includes('responseJudgment: context.responseJudgment'));
check('AST projection authority does not synthesize response judgments', !authority.includes('controller_response_invocation_not_connected') && !authority.includes('controller_response_complete'));
check('controller body AST has a distinct integrated variant', bodyTypes.includes('interface IntegratedSemanticControllerBodyAst<') && bodyTypes.includes('> extends SemanticControllerBodyAst') && bodyTypes.includes('readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>;'));
check('body parser retains integrated response judgment', bodyParser.includes('responseJudgment: projectionJudgment.responseJudgment'));
check('body parser keeps invocation-only outcome separate', bodyParser.includes("case 'invocation_only_projection':"));
check('test covers exact response object identity', test.includes('expect(result.responseJudgment).toBe(responseJudgment)'));
check('reasoning contract version advanced', contract.includes('readonly version: 3;') && contract.includes('version: 3,'));
check('judgment contract version advanced', contract.includes('readonly version: 12;'));
check('public AST projection exports remain available', publicIndex.includes('LaravelControllerAstProjectionResponseJudgment') && publicIndex.includes('LaravelControllerAstProjectionSemanticAuthorityInterface'));
check('controller relation dependency frontier stays within the audited ceiling', relationFiles <= 12);
check('no semantic/foundation imports in controller subscanner tree', foundationFiles === 0);
const result = {
  phase: 1988,
  title: 'Integrated Invocation/Response AST Projection Interface First',
  scope: 'existing interface contract, existing AST projection authority executor, and AST ADT retention; no new subscanner layers',
  checks,
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  trace: { controllerSubscannerTypeScriptFiles: files.length, relationImportFiles: relationFiles, foundationImportFiles: foundationFiles },
  typecheck: 'not-run',
  build: 'not-run',
};
fs.writeFileSync(path.join(root, 'PHASE1988_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`${result.passed}/${result.total} checks passed`);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
if (result.passed !== result.total) process.exitCode = 1;
