const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });

const ast = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const runtime = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsSize = fs.statSync(collectionsPath).size;

check('AST judgment exposes domain-specific manifest continuation', ast.includes('continueToManifestBuild'));
check('AST judgment has no generic Result continuation', !/continueWith\s*:\s*<Result>|continueWith<Result>|LaravelSourceAstProjectionJudgmentHandlers[\s\S]{0,200}Result/.test(ast));
check('AST continuation returns existing ManifestBuilderJudgment', ast.includes('Promise<ManifestBuilderJudgment>') && ast.includes("import type { ManifestBuilderJudgment } from './manifestBuilderInterface'"));
check('Complete and blocked producers attach domain continuation', (ast.match(/continueToManifestBuild:/g) || []).length === 3);
check('Manifest builder delegates to AST judgment operation', runtime.includes('projection.continueToManifestBuild({') && !runtime.includes('projection.continueWith({'));
check('AST pipeline implementation version matches contract', /contractVersion:\s*18/.test(pipeline) && /readonly contractVersion:\s*18/.test(ast));
check('AST pipeline interface is explicitly exported from upstream barrel', /laravelSourceAstPipelineInterface/.test(upstreamBarrel));
check('collections.ts remains empty', collectionsSize === 0, `${collectionsSize} bytes`);
for (const [name, source] of [
  ['laravelSourceAstPipelineInterface.ts', ast],
  ['laravelSourceAstPipeline.ts', pipeline],
  ['upstreamManifestBuilder.ts', runtime],
]) {
  check(`${name} has no export function declarations`, !/\bexport\s+function\s+/.test(source));
}
const report = {
  phase: 2938,
  title: 'Source AST to Manifest Domain Continuation',
  scope: [
    'LaravelSourceAstProjectionJudgment',
    'laravelSourceAstProjectionOperations',
    'upstreamManifestBuilder',
    'LaravelSourceAstPipelineInterface contract version',
    'upstream barrel export',
    'collections.ts empty invariant',
  ],
  checks,
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  structuralAuditPassed: checks.every(item => item.passed),
  syntaxTranspile: 'passed_for_3_scoped_typescript_files',
  typecheck: 'blocked_environment_missing_node_vitest_types_and_es2025_support',
  unitTests: 'not_run',
  build: 'not_run',
  endToEnd: 'not_run',
};
fs.writeFileSync(path.join(root, 'PHASE2938_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.structuralAuditPassed) process.exitCode = 1;
