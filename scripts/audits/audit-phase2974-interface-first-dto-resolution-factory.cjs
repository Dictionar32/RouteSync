const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authorityPath = 'packages/core/src/types/upstream/laravelControllerResponseDtoDeclarationResolutionAuthority.ts';
const pipelinePath = 'packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts';
const authority = read(authorityPath);
const pipeline = read(pipelinePath);
const coreIndex = read('packages/core/src/index.ts');
const runtimeEntries = [
  'packages/cli/src/upstreamCompositionFactory.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts',
  'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
];
const checks = [
  ['DTO declaration authority construction has a named factory interface', /interface LaravelControllerResponseDtoDeclarationResolutionAuthorityFactoryInterface/.test(authority)],
  ['factory runtime export is explicitly interface-typed and frozen', /export const laravelControllerResponseDtoDeclarationResolutionAuthorityFactory:\s*LaravelControllerResponseDtoDeclarationResolutionAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(authority)],
  ['factory exposes create as a domain construction operation', /readonly create:\s*\([\s\S]*LaravelControllerResponseDtoDeclarationResolutionAuthorityDependenciesInterface[\s\S]*\)\s*=>\s*LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface/.test(authority)],
  ['previous free factory export is removed', !/export const createLaravelControllerResponseDtoDeclarationResolutionAuthority\s*=/.test(authority) && !/export function createLaravelControllerResponseDtoDeclarationResolutionAuthority/.test(authority)],
  ['canonical singleton is built through the interface-first factory', /laravelControllerResponseDtoDeclarationResolutionAuthorityFactory\.create\(/.test(authority)],
  ['semantic pipeline uses factory.create rather than calling an exported factory function', /laravelControllerResponseDtoDeclarationResolutionAuthorityFactory\.create\(/.test(pipeline) && !/createLaravelControllerResponseDtoDeclarationResolutionAuthority\s*\(/.test(pipeline)],
  ['factory and its interface are available from the core public entry', /laravelControllerResponseDtoDeclarationResolutionAuthorityFactory/.test(coreIndex) && /LaravelControllerResponseDtoDeclarationResolutionAuthorityFactoryInterface/.test(coreIndex)],
  ['runtime entrypoint exports remain interface-typed object exports', runtimeEntries.every(file => !/^\s*export\s+(?:async\s+)?function\s+/m.test(read(file))) && runtimeEntries.every(file => !/^\s*export const\s+\w+\s*=\s*\(/m.test(read(file)))],
  ['deleted relation foundation remains absent', !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts'))],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];

function resolveRelative(from, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(root, path.dirname(from), specifier);
  const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), base];
  for (const candidate of candidates) {
    if (candidate.endsWith('.ts') && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return path.relative(root, candidate);
  }
  return null;
}
const seen = new Set();
const queue = [...runtimeEntries];
while (queue.length) {
  const file = queue.shift();
  if (seen.has(file) || !fs.existsSync(path.join(root, file))) continue;
  seen.add(file);
  const source = read(file);
  for (const match of source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/g)) {
    const resolved = resolveRelative(file, match[1]);
    if (resolved && !seen.has(resolved)) queue.push(resolved);
  }
}
let exportedFunctions = 0;
let inferredArrowExports = 0;
const functionFiles = new Set();
const arrowFiles = new Set();
for (const file of seen) {
  const source = read(file);
  for (const line of source.split('\n')) {
    if (/^\s*export\s+(?:async\s+)?function\s+/.test(line)) { exportedFunctions += 1; functionFiles.add(file); }
    if (/^\s*export\s+(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(/.test(line)) { inferredArrowExports += 1; arrowFiles.add(file); }
  }
}
const report = {
  phase: 2974,
  title: 'Interface-First DTO Declaration Resolution Factory',
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  checks: Object.fromEntries(checks.map(([label, passed]) => [label, passed])),
  runtimeTrace: {
    entrypoints: runtimeEntries,
    reachableTypeScriptFiles: seen.size,
    transitiveExportFunctionDeclarations: exportedFunctions,
    filesWithExportFunctionDeclarations: functionFiles.size,
    transitiveInferredArrowExports: inferredArrowExports,
    filesWithInferredArrowExports: arrowFiles.size,
    note: 'Transitive inventory is deliberately reported as migration debt; this phase converts one runtime-reachable upstream authority factory and does not claim every transitive export has been migrated.',
  },
  preservedConstraints: {
    deletedRelationFoundationRestored: false,
    upstreamCollectionsEmpty: fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0,
  },
};
fs.writeFileSync(path.join(root, 'PHASE2974_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`PHASE2974 interface-first DTO resolution audit: ${report.passed}/${report.total} checks passed.`);
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Runtime trace: ${seen.size} reachable files; ${exportedFunctions} exported function declarations across ${functionFiles.size} files; ${inferredArrowExports} inferred arrow exports across ${arrowFiles.size} files.`);
if (report.passed !== report.total) process.exitCode = 1;
