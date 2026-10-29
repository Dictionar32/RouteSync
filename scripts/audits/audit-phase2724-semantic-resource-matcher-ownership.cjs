const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.isAbsolute(p) ? p : path.join(root, p));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const resolverPath = 'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts';
const matcherPath = 'packages/core/src/compiler/semantic/resource-model/structuralFieldMatcher.ts';
const resolver = read(resolverPath);
const matcher = read(matcherPath);
const consumer = read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts');
const sdkTest = read('packages/sdk/tests/semanticAstDataflowAndRelationPropagation.spec.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
check('semantic matcher no longer imports scanner-owned ModelSymbolTable', !/from [\"'][^\"']*scanner\/symbols\/ModelSymbolTable/.test(matcher));
check('semantic matcher accepts the narrow symbol-collection contract', /StructuralModelSymbolCollectionInterface/.test(matcher) && /readonly all: \(\) => readonly OriginModelSymbol\[\]/.test(matcher));
check('ResourceModelResolver public entrypoint has a named interface', /export interface ResourceModelResolverInterface/.test(resolver));
check('ResourceModelResolver public entrypoint is a frozen interface-first object', /export const ResourceModelResolver:\s*ResourceModelResolverInterface\s*=\s*Object\.freeze\(\{\s*resolve:\s*resolveResourceModel,\s*resolvePort:\s*resolveResourceModelPortImplementation/s.test(resolver));
check('Resource model port implementation is internal, not exported', /const resolveResourceModelPortImplementation/.test(resolver) && !/export\s+(?:function|const)\s+resolveResourceModelPort\b/.test(resolver));
check('callable alias resolveResourceModelInterface removed', !/export\s+const\s+resolveResourceModelInterface\b/.test(resolver));
check('structural matcher implementation is owned by compiler semantic layer', exists(matcherPath) && !exists('packages/core/src/compiler/scanner/resolvers/resource/structuralFieldMatcher.ts'));
check('structural matcher has a named interface contract', /export interface StructuralFieldMatcherInterface/.test(matcher));
check('structural matcher is an interface-first frozen operation object', /export const structuralFieldMatcher:\s*StructuralFieldMatcherInterface\s*=\s*Object\.freeze\(\{\s*match:\s*matchStructuralFieldsImplementation/s.test(matcher));
check('structural matcher implementation is internal', /const matchStructuralFieldsImplementation\s*=/.test(matcher) && !/export\s+function\s+matchStructuralFields\b/.test(matcher));
check('resource model resolver consumes matcher through named operation', /structuralFieldMatcher\.match\(/.test(resolver));
check('actual resource binder uses typed resolver object', /ResourceModelResolver\.resolve\(/.test(consumer));
check('SDK regression tests retain public resolver object usage', /ResourceModelResolver\.resolve\(/.test(sdkTest));
check('CLI scan and sync both enter through manifestScanOperation', /manifestScanOperation\.scan\(/.test(cliScan) && /manifestScanOperation\.scan\(/.test(cliSync));
check('manifest builder preserves complete and blocked judgments', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder));
const changed = [resolverPath, matcherPath];
const unresolved = [];
for (const file of changed) {
  const body = read(file);
  for (const [, spec] of body.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if (!spec.startsWith('.')) continue;
    const base = path.resolve(path.dirname(path.join(root, file)), spec);
    if (![base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].some(exists)) unresolved.push(`${file}: ${spec}`);
  }
}
check('relative imports in changed runtime files resolve', unresolved.length === 0, unresolved.length ? unresolved.join('; ') : `${changed.length} files checked`);
const failures = checks.filter((item) => !item.pass);
const result = { phase: 2724, title: 'Semantic Resource Matcher Ownership', passed: checks.length - failures.length, total: checks.length, checks, changedFiles: changed, unresolvedRelativeImports: unresolved };
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/PHASE2724_SEMANTIC_RESOURCE_MATCHER_OWNERSHIP_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`RESULT ${result.passed}/${result.total}`);
if (failures.length) process.exitCode = 1;
