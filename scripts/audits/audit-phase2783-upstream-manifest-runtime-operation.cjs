'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const contract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const checks = [
  ['collections.ts remains 0 bytes; no generic collection wrapper restored', collections.length === 0],
  ['pipeline factory is exported as a named interface-typed runtime operation object', /export const laravelSourceAstPipelineFactory:\s*LaravelSourceAstPipelineFactoryInterface\s*=\s*Object\.freeze\(/.test(pipeline)],
  ['pipeline execution is an arrow operation, not an object method relying on this', /execute:\s*async\s*\(\)\s*:\s*Promise<LaravelSourceAstProjectionJudgment<Receipt>>\s*=>/.test(pipeline) && !/async execute\s*\(/.test(pipeline) && !/this\.(?:dependencies|input)/.test(pipeline)],
  ['pipeline factory input and dependencies are captured explicitly', (/create:\s*<Receipt extends/.test(pipeline) && /dependencies:\s*LaravelSourceAstPipelineDependenciesInterface/.test(pipeline) && /input:\s*LaravelSourceAstPipelineExecutionInput/.test(pipeline) && /const operation:\s*LaravelSourceAstPipelineInterface/.test(pipeline) && /input,\s*dependencies,|\s*dependencies,\s*input,/.test(pipeline))],
  ['pipeline result contract preserves explicit complete and blocked ADT variants', /laravel_source_ast_projection_complete/.test(contract) && /laravel_source_ast_projection_blocked/.test(contract) && /laravel_source_ast_projection_route_response_blocked/.test(contract)],
  ['manifest preparation is an interface-typed frozen operation object', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=\s*Object\.freeze\(/.test(builder)],
  ['manifest build is an arrow operation with lexical input/dependency capture', /build:\s*async\s*\(\)\s*:\s*Promise<ManifestBuilderJudgment>\s*=>/.test(builder) && !/async build\s*\(/.test(builder) && /sourceAstPipeline\.execute\(\)/.test(builder)],
  ['manifest builder refuses non-complete AST projection before source model construction', /if \(projection\.kind !== 'laravel_source_ast_projection_complete'\)[\s\S]*?manifest_builder_source_ast_blocked[\s\S]*?const completeAst = projection\.completion/.test(builder)],
  ['manifest output has a distinct complete judgment and typed blocked judgment', /ManifestBuilderCompleteJudgment/.test(manifestContract) && /ManifestBuilderBlockedJudgment/.test(manifestContract) && /ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(manifestContract)],
  ['CLI composition injects the upstream manifest preparation operation', /manifestBuilderOperationPreparation/.test(cliComposition)],
  ['upstream pipeline contract remains parameterless at execute boundary', /readonly execute:\s*\(\)\s*=>\s*Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(contract)],
  ['targeted runtime files do not expose exported function declarations', !/^export\s+function\s/m.test(pipeline) && !/^export\s+function\s/m.test(builder)],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 2783,
  title: 'Upstream Manifest Runtime Operation Object Closure',
  passed: failures.length === 0,
  checks: checks.length,
  passedChecks: checks.length - failures.length,
  failedChecks: failures,
  limits: [
    'Static source-contract audit only; no successful TypeScript build, full test run, or CLI end-to-end execution is claimed.',
    'SourceScanJudgment is not yet the end-to-end scanner-to-manifest ADT; the active pipeline retains LaravelSourceAstProjectionJudgment.',
    'collections.ts intentionally remains empty and its dependent imports remain unresolved until domain-owned contracts are migrated.',
    'The existing domain reasoning contract is unchanged; this phase adds no reasoning primitive.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase2783-upstream-manifest-runtime-operation.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${report.passedChecks}/${report.checks} checks passed`);
if (failures.length) console.log(`Failures: ${failures.join('; ')}`);
process.exitCode = failures.length ? 1 : 0;
