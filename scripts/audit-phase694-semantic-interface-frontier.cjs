const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const tsFiles = walk(core).filter(p => p.endsWith('.ts'));
const production = tsFiles.filter(p => !p.includes(`${path.sep}__tests__${path.sep}`) && !p.endsWith('.test.ts'));
const rel = p => path.relative(root, p).replaceAll(path.sep, '/');

const diagnostics = [];
const targetFiles = [
  'packages/core/src/types/domain/index.ts',
  'packages/core/src/types/domain/validationRules.ts',
  'packages/core/src/types/domain/expressions.ts',
  'packages/core/src/types/route.ts',
  'packages/core/src/types/ir/manifestIrTypes.ts',
  'packages/core/src/index.ts',
  'packages/core/src/compiler/scanner/StaticLaravelScanner.ts'
];
for (const file of targetFiles) {
  const result = cp.spawnSync(process.execPath, ['-e', `const ts=require('typescript'),fs=require('fs');const f=${JSON.stringify(path.join(root,file))};const d=(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext},fileName:f,reportDiagnostics:true}).diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);process.stdout.write(JSON.stringify(d.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' '))))`], { encoding: 'utf8' });
  if (result.status !== 0) diagnostics.push({ file, error: result.stderr.trim() });
  else { try { const d = JSON.parse(result.stdout); if (d.length) diagnostics.push({ file, diagnostics: d }); } catch { diagnostics.push({ file, error: result.stdout }); } }
}

const validation = read('packages/core/src/types/domain/validationRules.ts');
const kindMatch = validation.match(/export const ValidationRuleKind = Object\.freeze\(\{([\s\S]*?)\}\s*as const\)/);
const kinds = kindMatch ? [...kindMatch[1].matchAll(/^\s*\w+:\s*'([^']+)'/gm)].map(m => m[1]) : [];
const registryMatch = validation.match(/export const VALIDATION_RULE_REGISTRY: ValidationRuleRegistry = Object\.freeze\(\{([\s\S]*?)\}\);/);
const registryKeys = registryMatch ? [...registryMatch[1].matchAll(/\[ValidationRuleKind\.\w+\]/g)].length : 0;
const handlerMatch = validation.match(/export const ZOD_CONSTRAINT_REGISTRY: ConstraintRegistry = Object\.freeze\(\{([\s\S]*?)\}\);/);
const handlerKeys = handlerMatch ? [...handlerMatch[1].matchAll(/\[ValidationRuleKind\.\w+\]/g)].length : 0;

const parsedResourceRefs = production.flatMap(p => {
  const text = fs.readFileSync(p, 'utf8');
  const count = (text.match(/\bParsedResource\b/g) || []).length;
  return count ? [{ file: rel(p), count }] : [];
});

const duplicateAuthority = production.flatMap(p => {
  if (rel(p) === 'packages/core/src/types/domain/validationRules.ts') return [];
  const text = fs.readFileSync(p, 'utf8');
  const declarations = (text.match(/\b(?:export\s+)?(?:interface|type|const)\s+(?:ValidationRuleRegistry|VALIDATION_RULE_REGISTRY|ValidationRuleKind)\b/g) || []).length;
  return declarations ? [{ file: rel(p), declarations }] : [];
});

const hostNames = ['if','while','for','switch','map','filter','reduce','flatMap','undefined','null','any','new'];
const hostRegex = new RegExp(`\\b(?:${hostNames.join('|')})\\b|\\?\\?|===|as unknown|new Set|new Map`, 'g');
const frontierRoots = [
  'packages/core/src/compiler/scanner',
  'packages/core/src/compiler/domain',
  'packages/core/src/compiler/analysis',
  'packages/core/src/compiler/generators',
  'packages/core/src/compiler/diagnostics',
  'packages/core/src/compiler/relational',
  'packages/core/src/types/upstream',
  'packages/core/src/types/domain'
];
const hostFrontier = production.filter(p => frontierRoots.some(r => rel(p).startsWith(r + '/'))).flatMap(p => {
  const text = fs.readFileSync(p, 'utf8');
  const matches = [...text.matchAll(hostRegex)].map(m => m[0]);
  return matches.length ? [{ file: rel(p), entries: Object.fromEntries([...new Set(matches)].map(k => [k, matches.filter(x => x === k).length])) }] : [];
});

let vacuum = { candidates: [], remainingNonEmptyCandidates: [], allCandidatesEmpty: true };
try {
  const out = cp.execFileSync(process.execPath, [path.join(root, 'scripts/audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' });
  vacuum = JSON.parse(out);
} catch (e) {
  vacuum = { error: String(e.stdout || e.message) };
}

const result = {
  phase: 694,
  kind: 'semantic-interface-frontier',
  diagnosticBoundary: { targetedTranspileDiagnostics: diagnostics },
  validationRegistry: { semanticKinds: kinds.length, registryEntries: registryKeys, handlerEntries: handlerKeys, complete: kinds.length === registryKeys && registryKeys === handlerKeys },
  legacyParsedResource: { productionReferences: parsedResourceRefs, empty: parsedResourceRefs.length === 0 },
  duplicateValidationAuthority: { productionReferences: duplicateAuthority, canonicalFile: 'packages/core/src/types/domain/validationRules.ts' },
  hostFrontier,
  retiredManifestDescriptors: [
    'packages/core/src/compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts',
    'packages/core/src/compiler/scanner/descriptors/manifest/routeManifestDescriptor.ts'
  ],
  inactiveVacuum: vacuum,
  status: diagnostics.length === 0 && kinds.length === registryKeys && registryKeys === handlerKeys && parsedResourceRefs.length === 0 && vacuum.allCandidatesEmpty ? 'PASS' : 'REVIEW'
};
console.log(JSON.stringify(result, null, 2));
