const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.isAbsolute(p) ? p : path.join(root, p));
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
const semanticPath = 'packages/core/src/compiler/semantic/resource-model/resourceModelBinding.ts';
const scannerPath = 'packages/core/src/compiler/scanner/symbols/resource/resourceBindingTypes.ts';
const semantic = read(semanticPath);
const resolver = read('packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts');
const binder = read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts');
const barrel = read('packages/core/src/compiler/scanner/symbols/resource/index.ts');
const sdkTest = read('packages/sdk/tests/semanticAstDataflowAndRelationPropagation.spec.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
check('resource binding ADT is owned by compiler semantic layer', exists(semanticPath) && !exists(scannerPath));
check('binding ADT retains mono/poly/unbacked DTO discriminants', /kind: 'mono'/.test(semantic) && /kind: 'poly'/.test(semantic) && /kind: 'unbacked_dto'/.test(semantic));
check('public matcher is interface-first frozen object', /export interface ResourceModelBindingMatcherInterface/.test(semantic) && /export const resourceModelBindingMatcher:\s*ResourceModelBindingMatcherInterface\s*=\s*Object\.freeze\(\{\s*match: matchResourceModelBindingImplementation/s.test(semantic));
check('matcher free function is not exported', !/export\s+function\s+matchResourceModelBinding\b/.test(semantic));
check('factory is interface-first frozen object rather than exported class', /export interface ResourceModelBindingFactoryInterface/.test(semantic) && /export const resourceModelBindingFactory:\s*ResourceModelBindingFactoryInterface\s*=\s*Object\.freeze\(/.test(semantic) && !/export\s+class\s+ResourceModelBindingFactory\b/.test(semantic));
check('resolver uses semantic factory and matcher operations', /resourceModelBindingFactory\.mono\(/.test(resolver) && /resourceModelBindingMatcher\.match\(/.test(resolver));
check('resource binder consumes semantic matcher operation', /resourceModelBindingMatcher\.match\(/.test(binder));
check('scanner compatibility barrel only re-exports semantic-owned contract', /from '\.\.\/\.\.\/\.\.\/semantic\/resource-model\/resourceModelBinding'/.test(barrel));
check('SDK regression test uses typed operation objects', /resourceModelBindingFactory\.mono\(/.test(sdkTest) && /resourceModelBindingMatcher\.match\(/.test(sdkTest));
check('CLI scan and sync enter via manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan) && /manifestScanOperation\.scan\(/.test(cliSync));
check('manifest builder preserves complete and blocked judgments', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder));
check('no source import refers to deleted resourceBindingTypes module', !/resourceBindingTypes/.test([...walk(path.join(root, 'packages'))].filter(p => p.endsWith('.ts')).map(p => fs.readFileSync(p, 'utf8')).join('\n')));
const changed = [semanticPath, 'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts', 'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts', 'packages/core/src/compiler/scanner/symbols/resource/index.ts', 'packages/core/src/index.ts', 'packages/sdk/tests/semanticAstDataflowAndRelationPropagation.spec.ts'];
const unresolved = [];
for (const file of changed) {
  const body = read(file);
  for (const [, spec] of body.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if (!spec.startsWith('.')) continue;
    const base = path.resolve(path.dirname(path.join(root, file)), spec);
    if (![base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].some(exists)) unresolved.push(`${file}: ${spec}`);
  }
}
check('relative imports in changed files resolve', unresolved.length === 0, unresolved.length ? unresolved.join('; ') : `${changed.length} files checked`);
function* walk(dir) { for (const ent of fs.readdirSync(dir, {withFileTypes:true})) { const p=path.join(dir,ent.name); if(ent.isDirectory()) yield* walk(p); else yield p; } }
const failures = checks.filter(x => !x.pass);
const result = { phase: 2725, title: 'Semantic Resource Binding Ownership', passed: checks.length-failures.length, total: checks.length, checks, changedFiles: changed, unresolvedRelativeImports: unresolved };
fs.mkdirSync(path.join(root, 'reports'), {recursive:true});
fs.writeFileSync(path.join(root, 'reports/PHASE2725_SEMANTIC_RESOURCE_BINDING_OWNERSHIP_AUDIT.json'), JSON.stringify(result,null,2)+'\n');
for(const x of checks) console.log(`${x.pass?'PASS':'FAIL'} ${x.name}${x.detail?' — '+x.detail:''}`);
console.log(`RESULT ${result.passed}/${result.total}`);
if(failures.length) process.exitCode=1;
