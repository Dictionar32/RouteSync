const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const authority = read('packages/core/src/types/upstream/semanticRewriteAuthority.ts');
const runtimePath = 'packages/core/src/types/upstream/semanticRewriteRuntimeExecutor.ts';
const runtimeExists = fs.existsSync(path.join(root, runtimePath));
const binding = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const behavior = read('packages/core/src/types/upstream/semanticRelationalBehaviorKernel.ts');
const identity = read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts');
const facade = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteInterface.ts');
const resolver = read('packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const checks = [
  ['resource-model binding calls upstream relation authority directly', /semanticRewriteAuthority\.resolveRelations\(/.test(binding) && !/semanticRewriteRuntimeExecutor/.test(binding)],
  ['semantic behavior kernel calls upstream constraint and relation authorities directly', /semanticRewriteAuthority\.resolveConstraints\(/.test(behavior) && /semanticRewriteAuthority\.resolveRelations\(/.test(behavior) && !/semanticRewriteRuntimeExecutor/.test(behavior)],
  ['object identity authority calls upstream relation authority directly', /semanticRewriteAuthority\.resolveRelations\(/.test(identity) && !/semanticRewriteRuntimeExecutor/.test(identity)],
  ['resolver graph uses upstream-owned closed relation operation', /solveClosedSemanticRelations/.test(resolver) && !/semanticRewriteRuntimeExecutor/.test(resolver)],
  ['closed relation operation is owned by upstream authority module', /export const solveClosedSemanticRelations/.test(authority) && /semanticRewriteAuthority\.resolve\(/.test(authority)],
  ['scanner compatibility facade exports operation from upstream authority', /types\/upstream\/semanticRewriteAuthority/.test(facade)],
  ['runtime forwarding module is removed after production consumers moved to authority', !runtimeExists && !/semanticRewriteRuntimeExecutor/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['removed runtime module cannot expose parameterized execute/dispatch/run callables', !runtimeExists],
  ['manifest version is a closed value, not a zero-argument const factory', /const manifestVersion = Object\.freeze\(/.test(manifestBuilder) && !/const version = \(\) =>/.test(manifestBuilder) && /version: manifestVersion/.test(manifestBuilder)],
  ['phase audit script is registered in package scripts', packageJson.scripts?.['audit:phase2444-semantic-runtime-direct-authority'] === 'node scripts/audits/audit-phase2444-semantic-runtime-direct-authority.cjs'],
  ['active source-AST pipeline boundary is explicitly left as a separate acquisition operation', /sourceAstPipeline\.execute\(pipelineInput\)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
