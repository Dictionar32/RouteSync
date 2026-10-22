const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const checks = [
  ['existing LaravelRouteScannerInterface owns the method authority', /readonly declarationMethodAuthority: LaravelRouteDeclarationMethodJudgmentAuthority/.test(contract)],
  ['scanner factory returns the existing LaravelRouteScannerInterface', /\): LaravelRouteScannerInterface => Object\.freeze/.test(scanner)],
  ['factory reuses the existing contract shape rather than a duplicate interface', /Pick<\s*LaravelRouteScannerInterface/.test(scanner)],
  ['scanner factory captures the declared method authority dependency', /authorities\.declarationMethodAuthority/.test(scanner)],
  ['scanner execution does not reach back into the exported singleton', !/laravelRouteScanner\.(declarationMethodAuthority|authorizationAuthority|effectiveControllerActionPolicyExecutor)/.test(scanner)],
  ['route method judgment is produced by the injected authority operation', /methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(scanner)],
  ['HTTP emission consumes the closed judgment result', /emitStandardRoutes\(methodJudgment\.httpMethods/.test(scanner)],
  ['authorization authority is supplied through the factory dependency contract', /authorities\.authorizationAuthority/.test(scanner)],
  ['effective policy executor is supplied through the factory dependency contract', /authorities\.effectiveControllerActionPolicyExecutor/.test(scanner)],
  ['source-AST pipeline dependencies use the existing route scanner interface', /readonly routeScanner: LaravelRouteScannerInterface/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['pipeline composition supplies the same scanner instance', /routeScanner: laravelRouteScanner/.test(pipeline)],
  ['pipeline invokes the injected scanner operation', /routeScanner\.scan\(/.test(pipeline)],
  ['manifest builder executes the source-AST pipeline', /laravelSourceAstPipeline\.execute\(pipelineInput\)/.test(builder)],
  ['CLI composition delegates to manifest builder', /manifestBuilder\.build\(/.test(cliComposition)],
  ['CLI scan delegates through invocation composition', /buildManifestWithInvocationPipeline/.test(cliScan)],
  ['route scanner file has no semantic foundation dependency', !/semantic\/foundation/.test(scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2359 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2359 audit failed');
