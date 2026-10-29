const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstreamRoot = path.join(root, 'packages/core/src/types/upstream');
const collectionsPath = path.join(upstreamRoot, 'collections.ts');
const relative = file => path.relative(root, file).split(path.sep).join('/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') && !/(^|[\\/])(__tests__|tests)([\\/]|$)|\.test\.ts$/.test(target) ? [target] : [];
});
const files = walk(upstreamRoot);
const exportedFunctions = [];
const directArrowExports = [];
const explicitlyTypedDirectArrowExports = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/^\s*export\s+(?:declare\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\b/gm)) {
    exportedFunctions.push({ file: relative(file), name: match[1] });
  }
  const exportConstPattern = /^\s*export\s+const\s+([A-Za-z_$][\w$]*)\b/gm;
  for (const match of source.matchAll(exportConstPattern)) {
    let cursor = match.index + match[0].length;
    // The initializer starts at the first assignment delimiter in this declaration head.
    const equals = source.indexOf('=', cursor);
    const semicolonBeforeEquals = source.indexOf(';', cursor);
    if (equals < 0 || (semicolonBeforeEquals >= 0 && semicolonBeforeEquals < equals)) continue;
    const initializer = source.slice(equals + 1, Math.min(source.length, equals + 500));
    const arrowHead = /^\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=>/.test(initializer);
    if (!arrowHead) continue;
    const entry = { file: relative(file), name: match[1] };
    directArrowExports.push(entry);
    const declarationHead = source.slice(cursor, equals);
    if (/\S/.test(declarationHead) && declarationHead.includes(':')) explicitlyTypedDirectArrowExports.push(entry);
  }
}
const modelPath = path.join(upstreamRoot, 'semanticDataflowKnowledge.ts');
const model = fs.readFileSync(modelPath, 'utf8');
const callsiteFiles = walk(path.join(root, 'packages')).map(file => ({ file, source: fs.readFileSync(file, 'utf8') }));
const checks = {
  dependencyOperationHasNamedInterface: /export interface SemanticDependencyOperationsInterface[\s\S]*?readonly create:[\s\S]*?export const semanticDependency:\s*SemanticDependencyOperationsInterface\s*=\s*Object\.freeze\(\{/.test(model),
  valueFlowOperationHasNamedInterface: /export interface SemanticValueFlowOperationsInterface[\s\S]*?readonly create:[\s\S]*?export const semanticValueFlow:\s*SemanticValueFlowOperationsInterface\s*=\s*Object\.freeze\(\{/.test(model),
  edgeOperationHasNamedInterface: /export interface SemanticDataFlowEdgeOperationsInterface[\s\S]*?readonly create:[\s\S]*?export const semanticEdge:\s*SemanticDataFlowEdgeOperationsInterface\s*=\s*Object\.freeze\(\{/.test(model),
  identifierOperationHasNamedInterface: /export interface SemanticIdentifierOperationsInterface[\s\S]*?readonly create:[\s\S]*?export const semanticIdentifier:\s*SemanticIdentifierOperationsInterface\s*=\s*Object\.freeze\(\{/.test(model),
  semanticOperationHasNamedInterface: /export interface SemanticOperationOperationsInterface[\s\S]*?readonly create:[\s\S]*?export const semanticOperation:\s*SemanticOperationOperationsInterface\s*=\s*Object\.freeze\(\{/.test(model),
  dependencyCallSitesUseCreate: callsiteFiles.every(({ source }) => !/(?<![\w.$])semanticDependency\s*\(/.test(source)),
  valueFlowCallSitesUseCreate: callsiteFiles.every(({ source }) => !/(?<![\w.$])semanticValueFlow\s*\(/.test(source)),
  edgeCallSitesUseCreate: callsiteFiles.every(({ source }) => !/(?<![\w.$])semanticEdge\s*\(/.test(source)),
  identifierCallSitesUseCreate: callsiteFiles.every(({ source }) => !/(?<![\w.$])semanticIdentifier\s*\(/.test(source)),
  semanticOperationCallSitesUseCreate: callsiteFiles.every(({ source }) => !/(?<![\w.$])semanticOperation\s*\(/.test(source)),
  semanticRelationshipKeepsExplicitCodeAndEndpoints: /export type SemanticDataFlowRelationCode\s*=\s*'depends_on'\s*\|\s*'flows_to'/.test(model) && /export interface SemanticDataFlowEdge\s*\{[\s\S]*?readonly from: KnowledgeId;[\s\S]*?readonly to: KnowledgeId;[\s\S]*?readonly relation: SemanticDataFlowRelationDefinition;/.test(model),
  collectionsRemainEmpty: fs.statSync(collectionsPath).size === 0,
};
const result = {
  phase: 2869,
  title: 'Semantic Data-Flow Interface-First Domain Operations',
  upstreamTypeScriptFileCount: files.length,
  exportedFunctionDeclarationCount: exportedFunctions.length,
  exportedFunctionDeclarationSample: exportedFunctions.slice(0, 40),
  directArrowExportCount: directArrowExports.length,
  untypedDirectArrowExportCount: directArrowExports.length - explicitlyTypedDirectArrowExports.length,
  directArrowExportSample: directArrowExports.slice(0, 60),
  explicitlyTypedDirectArrowExportCount: explicitlyTypedDirectArrowExports.length,
  explicitlyTypedDirectArrowExportSample: explicitlyTypedDirectArrowExports.slice(0, 30),
  migratedDomainOperations: ['semanticDependency.create', 'semanticValueFlow.create', 'semanticEdge.create', 'semanticIdentifier.create', 'semanticOperation.create'],
  checks,
  passedChecks: Object.values(checks).filter(Boolean).length,
  totalChecks: Object.keys(checks).length,
  collectionsBytes: fs.statSync(collectionsPath).size,
};
const reportPath = path.join(upstreamRoot, 'PHASE2869_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.passedChecks !== result.totalChecks) process.exitCode = 1;
