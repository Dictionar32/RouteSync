const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const checks = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const countMatches = (directory, pattern) => {
  let count = 0;
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const text = fs.readFileSync(absolute, 'utf8');
        count += [...text.matchAll(pattern)].length;
      }
    }
  };
  visit(path.join(root, directory));
  return count;
};
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const assembler = read('packages/core/src/graph/service/graphAssembler.ts');
const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const serviceIndex = read('packages/core/src/graph/service/index.ts');
const basicBlock = read('packages/core/src/compiler/utils/cfg/basicBlock.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');

check('graph assembler has explicit operation interface', /export interface ServiceGraphAssemblyOperationsInterface/.test(assembler) && /serviceGraphAssemblyOperations:\s*ServiceGraphAssemblyOperationsInterface\s*=\s*Object\.freeze/.test(assembler), 'graph assembly public API is interface-first and frozen');
check('manifest graph compiler has explicit operation interface', /export interface ManifestGraphCompilationOperationsInterface/.test(compiler) && /manifestGraphCompilationOperations:\s*ManifestGraphCompilationOperationsInterface\s*=\s*Object\.freeze/.test(compiler), 'graph compilation public API is interface-first and frozen');
check('production builder invokes operation objects', /serviceGraphAssemblyOperations\.assemble\(/.test(builder) && /manifestGraphCompilationOperations\.compile\(/.test(builder), 'ServiceGraphBuilder uses the operation objects');
check('barrel exports operation objects and interfaces', /serviceGraphAssemblyOperations, type ServiceGraphAssemblyOperationsInterface/.test(serviceIndex) && /manifestGraphCompilationOperations, type ManifestGraphCompilationOperationsInterface/.test(serviceIndex), 'barrel exposes typed operations, not legacy free functions');
check('graph assembler no longer imports relationFoundation', !/relationFoundation/.test(assembler) && /entry\.reference\.kind === 'model_reference'/.test(assembler) && /entry\.reference\.kind === 'service_reference'/.test(assembler), 'literal discriminants use direct equality');
check('manifest graph compiler no longer imports relationFoundation', !/relationFoundation/.test(compiler) && /relationContains\(actionNames, action\.action\)\s*\?/.test(compiler), 'direct branch replaces relationResolve in controller action accumulation');
check('basic block relation builder no longer imports relationFoundation', !/relationFoundation/.test(basicBlock) && /index >= entries\.length\s*\?/.test(basicBlock) && /index >= blocks\.length\s*\?/.test(basicBlock), 'recursive tuple builders use explicit conditionals');
check('CLI scan reaches manifest scan operation', /manifestScanOperation/.test(cliScan) && /\.scan\(Object\.freeze\(/.test(cliScan), 'scan command calls the composed manifest scan operation');
check('CLI sync reaches manifest scan operation', /manifestScanOperation/.test(cliSync) && /\.scan\(Object\.freeze\(/.test(cliSync), 'sync command calls the composed manifest scan operation');
check('upstream composition creates manifest scan operation', /manifestScanOperation:\s*routeSyncCliManifestScanOperationFactory\.create\(manifestComposition\)/.test(composition), 'CLI composition owns the manifest scan operation');
check('manifest builder preserves complete and blocked ADT', /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder) && /kind:\s*'manifest_builder_complete'/.test(manifestBuilder), 'builder preserves both judgment variants');
check('removed relationFoundation file is not recreated', !exists('packages/core/src/semantic/relations/relationFoundation.ts') && !exists('packages/core/src/semantic/foundation/relationFoundation.ts') && !exists('packages/core/src/semantic/kernel/relationFoundation.ts'), 'no relationFoundation implementation module exists');
const refs = countMatches('packages/core/src', /relationFoundation/g);
const filesWithRefs = (() => {
  let count = 0;
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.ts') && /relationFoundation/.test(fs.readFileSync(absolute, 'utf8'))) count++;
    }
  };
  visit(path.join(root, 'packages/core/src'));
  return count;
})();
check('remaining relationFoundation references are explicitly reported', refs === 33 && filesWithRefs === 25, `${refs} references remain in ${filesWithRefs} TypeScript files; this phase removes references only from graph assembler, graph compiler, and basicBlock`);

const result = { phase: 2732, audit: 'graph-runtime-relation-ownership', checks, passed: checks.filter(item => item.passed).length, total: checks.length, relationFoundationReferences: refs, relationFoundationFiles: filesWithRefs };
fs.writeFileSync(path.join(root, 'reports/PHASE2732_GRAPH_RUNTIME_RELATION_OWNERSHIP_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`);
console.log(`RESULT ${result.passed}/${result.total}`);
process.exitCode = result.passed === result.total ? 0 : 1;
