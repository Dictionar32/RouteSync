const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['projection judgment has complete and blocked ADT variants', /export type LaravelSourceAstProjectionJudgment(?:<[^>]+>)?\s*=\s*[\s\S]*?laravel_source_ast_projection_complete[\s\S]*?\|[\s\S]*?laravel_source_ast_projection_blocked/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['complete outcome requires existing proof-bearing CompleteSourceAst', /readonly completion:\s*CompleteSourceAst/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['blocked outcome retains partial ASTs and typed IncompleteUpstream', /readonly partial:\s*SourceAsts/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts')) && /readonly completeness:\s*IncompleteUpstream/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['pipeline interface returns outcome-indexed judgment with receipt preservation', /Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['scanner interface preserves the same outcome-indexed judgment with receipt preservation', /Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(read('packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts'))],
  ['public API exports the judgment type', /export type \{ LaravelSourceAstProjectionJudgment \}/.test(read('packages/core/src/index.ts'))],
  ['no relation/foundation subscanner folder added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['runtime pipeline executes the projection ADT and publishes contract v3', read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('LaravelSourceAstProjectionJudgment') && /contractVersion: 3/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['runtime scanner facade preserves the projection ADT and publishes contract v3', read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts').includes('LaravelSourceAstProjectionJudgment') && /contractVersion: 3/.test(read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passed = checks.filter(([, ok]) => ok).length;
console.log(`RESULT ${passed}/${checks.length}`);
if (passed !== checks.length) process.exitCode = 1;
