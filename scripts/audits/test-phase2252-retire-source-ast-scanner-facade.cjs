const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let passed = 0;
const check = (label, condition) => {
  if (!condition) {
    process.stderr.write(`FAIL ${label}\n`);
    process.exitCode = 1;
    return;
  }
  passed += 1;
  process.stdout.write(`PASS ${label}\n`);
};
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const facade = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const facadeContract = read('packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
check('manifest production path consumes the source-AST pipeline directly', /laravelSourceAstPipeline\.execute\(/.test(builder));
check('manifest production path no longer imports the source-AST scanner facade', !/sourceAstScanner|laravelSourceAstScanner/.test(builder));
check('scanner facade implementation has no runtime scanner or compatibility function', !/laravelSourceAstScanner|scanSourceAsts|\.scan\(/.test(facade));
check('scanner facade contract module is inert', !/LaravelSourceAstScannerInterface|laravel_source_ast_scanner|readonly scan:/.test(facadeContract));
check('upstream public barrel no longer exports the retired scanner facade contract', !/laravelSourceAstScannerInterface/.test(upstreamBarrel));
check('the existing source-AST pipeline contract remains the production boundary', /interface LaravelSourceAstPipelineInterface/.test(pipelineContract) && /readonly execute:/.test(pipelineContract));
process.stdout.write(`Phase 2252 source-AST scanner facade retirement audit: ${passed}/6 passed\n`);
