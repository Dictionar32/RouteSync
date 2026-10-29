const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const source = fs.readFileSync(upstream, 'utf8');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.ts') && !/(^|[\\/])(__tests__|tests)([\\/]|$)|\.test\.ts$/.test(file)) sourceFiles.push(file);
  }
}
walk(path.join(root, 'packages/core/src'));
const allSource = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const checks = {
  assignmentEffectUsesNamedInterfaceFirstOperation: /export const semanticAssignmentEffect:\s*SemanticAssignmentEffectOperationsInterface\s*=\s*Object\.freeze\(\{/.test(source),
  assignmentReferenceUsesNamedInterfaceFirstOperation: /export const semanticAssignmentReference:\s*SemanticAssignmentReferenceOperationsInterface\s*=\s*Object\.freeze\(\{/.test(source),
  sourceFactoryUsesNamedInterfaceFirstOperation: /export const semanticSource:\s*SemanticSourceOperationsInterface\s*=\s*Object\.freeze\(\{/.test(source),
  dataFlowRoleUsesNamedInterfaceFirstOperation: /export const semanticDataFlowRole:\s*SemanticDataFlowRoleOperationsInterface\s*=\s*Object\.freeze\(\{/.test(source),
  semanticPresenceHasDomainContinuation: /readonly continueWith:\s*<R>\(handlers: SemanticPresenceHandlers<T, R>\) => R/.test(source),
  presenceConstructorsAreInterfaceFirstOperations: /export const semanticPresenceOperations:\s*SemanticPresenceOperationsInterface\s*=\s*Object\.freeze\(\{/.test(source),
  sourceFactoryCallSitesUseCreateOperation: !/\bsemanticSource\s*\(/.test(allSource) && /semanticSource\.create\(/.test(allSource),
  roleCallSitesUseResolveOperation: !/\bsemanticDataFlowRole\s*\(/.test(source) && /semanticDataFlowRole\.resolve\(/.test(source),
  noExportFunctionDeclarationsInUpstreamKnowledge: !/\bexport\s+(?:async\s+)?function\s+/.test(source),
  collectionsRemainEmpty: fs.statSync(collections).size === 0,
};
const upstreamFiles = sourceFiles.filter(file => file.includes(`${path.sep}types${path.sep}upstream${path.sep}`));
const directArrowExportInventory = [];
for (const file of upstreamFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/^\s*export\s+const\s+([A-Za-z_$][\w$]*)\b/gm)) {
    const cursor = match.index + match[0].length;
    const equals = text.indexOf('=', cursor);
    const semicolonBeforeEquals = text.indexOf(';', cursor);
    if (equals < 0 || (semicolonBeforeEquals >= 0 && semicolonBeforeEquals < equals)) continue;
    const initializer = text.slice(equals + 1, Math.min(text.length, equals + 500));
    if (/^\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=>/.test(initializer)) directArrowExportInventory.push({ file: path.relative(root, file).split(path.sep).join('/'), name: match[1] });
  }
}
const result = { phase: 2868, title: 'Fully Typed Runtime Scanner Operations — Actionable Upstream ADT', productionTypeScriptFiles: sourceFiles.length, checks, passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length, upstreamDirectArrowExportCount: directArrowExportInventory.length, upstreamDirectArrowExportSample: directArrowExportInventory.slice(0, 30), collectionsBytes: fs.statSync(collections).size };
const report = path.join(root, 'packages/core/src/types/upstream/PHASE2868_AUDIT.json');
fs.writeFileSync(report, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.passedChecks !== result.totalChecks) process.exitCode = 1;
