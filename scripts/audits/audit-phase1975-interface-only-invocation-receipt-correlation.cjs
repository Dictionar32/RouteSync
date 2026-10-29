const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['projection judgment has complete and blocked ADT variants', /export type LaravelSourceAstProjectionJudgment(?:<[\s\S]*?>)?\s*=\s*[\s\S]*?laravel_source_ast_projection_complete[\s\S]*?\|[\s\S]*?laravel_source_ast_projection_blocked/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['complete outcome requires existing proof-bearing CompleteSourceAst', /readonly completion:\s*CompleteSourceAst/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['complete AST correlates canonical inventory to the exact receipt subtype', /readonly ast:\s*SourceAsts & \{ readonly controllerInvocationSemanticInventory: Receipt \}/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['blocked outcome retains partial ASTs and typed IncompleteUpstream', /readonly partial:\s*SourceAsts/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts')) && /readonly completeness:\s*IncompleteUpstream/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['blocked AST correlates canonical inventory to the exact receipt subtype', /readonly partial:\s*SourceAsts & \{ readonly controllerInvocationSemanticInventory: Receipt \}/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['pipeline interface preserves receipt subtype through generic judgment', /execute:\s*<Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>[\s\S]*?Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['scanner interface preserves receipt subtype through generic judgment', /scan:\s*<Receipt extends LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt>[\s\S]*?Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(read('packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts'))],
  ['public API exports the judgment type', /export type \{ LaravelSourceAstProjectionJudgment \}/.test(read('packages/core/src/index.ts'))],
  ['no relation/foundation subscanner folder exists', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['no semantic authority or executor implementation was added to the interface contract', !/\b(const|function)\s+\w+/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['runtime pipeline implementation remains untouched by this phase', !read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('LaravelSourceAstProjectionJudgment')],
  ['runtime scanner facade remains untouched by this phase', !read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts').includes('LaravelSourceAstProjectionJudgment')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passed = checks.filter(([, ok]) => ok).length;
console.log(`RESULT ${passed}/${checks.length}`);
if (passed !== checks.length) process.exitCode = 1;
