const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
const semanticPath = 'packages/core/src/compiler/semantic/request-type-derivation/semanticMappingContractDerivation.ts';
const legacyPath = 'packages/core/src/compiler/scanner/operations/request-deriver/semanticMappingDeriver.ts';
const semantic = read(semanticPath);
const lowererPath = 'packages/core/src/compiler/passes/lowerers/requestTypesLowerers.ts';
const lowerer = read(lowererPath);
const barrel = read('packages/core/src/compiler/scanner/operations/request-deriver/index.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
check('semantic mapping implementation is owned by compiler semantic layer', exists(semanticPath) && !exists(legacyPath));
check('public derivation contract is interface-first', /export interface SemanticMappingContractDerivationInterface/.test(semantic) && /export const semanticMappingContractDerivation:\s*SemanticMappingContractDerivationInterface\s*=\s*Object\.freeze\(/.test(semantic));
check('free function derivation is internal rather than exported', /const deriveSemanticMappingContractImplementation\s*=/.test(semantic) && !/export\s+function\s+deriveSemanticMappingContract/.test(semantic));
check('runtime lowerer calls typed operation object', /semanticMappingContractDerivation\.derive\(artifact\.requestTypes\)/.test(lowerer));
check('legacy subdomain barrel only re-exports typed semantic operation', /semanticMappingContractDerivation, type SemanticMappingContractDerivationInterface/.test(barrel) && !/export\s*\{\s*deriveSemanticMappingContract\s*\}/.test(barrel));
check('mapper semantics preserve read and write directions', /directions: Object\.freeze\(\['read', 'write'\]\)/.test(semantic) && /read: Object\.freeze\(read\)/.test(semantic) && /write: Object\.freeze\(write\)/.test(semantic));
check('semantic mapping contract retains closed upstream judgment', /kind: 'semantic_mapping_contract'/.test(semantic) && /authority: 'upstream'/.test(semantic) && /closed: true/.test(semantic));
check('CLI scan and sync enter through manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan) && /manifestScanOperation\.scan\(/.test(cliSync));
check('manifest builder preserves complete and blocked judgments', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder));
const changed = [semanticPath, lowererPath, 'packages/core/src/compiler/scanner/operations/request-deriver/index.ts'];
const unresolved = [];
for (const file of changed) {
  const body = read(file);
  for (const [, spec] of body.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if (!spec.startsWith('.')) continue;
    const base = path.resolve(path.dirname(path.join(root, file)), spec);
    if (![base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].some(fs.existsSync)) unresolved.push(`${file}: ${spec}`);
  }
}
check('relative imports in changed files resolve', unresolved.length === 0, unresolved.length ? unresolved.join('; ') : `${changed.length} files checked`);
function* walk(dir) { for (const ent of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, ent.name); if (ent.isDirectory()) yield* walk(p); else yield p; } }
const tsFiles = [...walk(path.join(root, 'packages'))].filter(p => p.endsWith('.ts'));
const relationRefs = [];
let relationReferenceOccurrences = 0;
for (const file of tsFiles) {
  const body = fs.readFileSync(file, 'utf8');
  const matches = body.match(/relationFoundation/g) || [];
  if (matches.length) relationRefs.push(path.relative(root, file));
  relationReferenceOccurrences += matches.length;
}
check('no replacement relationFoundation created', !exists('packages/core/src/semantic/foundation/relationFoundation.ts') && !exists('packages/core/src/semantic/kernel/relationFoundation.ts') && !exists('packages/core/src/semantic/relations/relationFoundation.ts'), 'legacy import references are reported separately, not hidden');
const failures = checks.filter(x => !x.pass);
const result = { phase: 2726, title: 'Semantic Mapping Runtime Ownership', passed: checks.length - failures.length, total: checks.length, checks, changedFiles: changed, unresolvedRelativeImports: unresolved, relationFoundationReferenceFiles: relationRefs.length, relationFoundationReferenceOccurrences: relationReferenceOccurrences, relationFoundationReferenceFileList: relationRefs };
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/PHASE2726_SEMANTIC_MAPPING_RUNTIME_OWNERSHIP_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`relationFoundation references: ${relationReferenceOccurrences} occurrences across ${relationRefs.length} files`);
console.log(`RESULT ${result.passed}/${result.total}`);
if (failures.length) process.exitCode = 1;
