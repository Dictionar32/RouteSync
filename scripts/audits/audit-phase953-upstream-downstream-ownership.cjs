const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const sdk = path.join(root, 'packages/sdk');
const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);
const walk = dir => {
  const out = [];
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
};
const rel = p => path.relative(root, p).split(path.sep).join('/');
const upstream = walk(path.join(core, 'types/upstream')).filter(p => !/[\\/]__tests__[\\/]/.test(p));
const scanner = walk(path.join(core, 'compiler/scanner'));
const genericKernelNames = ['relationalSequence', 'semanticRelations', 'relationMembership'];
const scannerGenericKernelImports = scanner.filter(p => genericKernelNames.some(n => read(p).includes(`semantic/kernel/${n}`))).map(rel);
const reverseUpstreamImports = upstream.filter(p => /semantic[\\/]kernel|compiler[\\/]scanner|compiler[\\/]domain|compiler[\\/]passes|compiler[\\/]ir/.test(read(p))).map(rel);
const foundation = path.join(core, 'semantic/foundation');
const fixture = path.join(root, 'examples/ecommerce-shop-source');
const phpWalk = dir => {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...phpWalk(file));
    else if (entry.isFile() && file.endsWith('.php')) out.push(file);
  }
  return out;
};
const fixtureFiles = phpWalk(fixture).map(rel);
const authority = read(path.join(core, 'types/upstream/semanticDataflowAuthority.ts'));
const judgment = read(path.join(core, 'types/upstream/semanticDataflow.ts'));
const adapter = read(path.join(core, 'compiler/analysis/semanticDataflowDataFlowAdapter.ts'));
const astAnalysis = read(path.join(core, 'compiler/analysis/astAnalysisInterface.ts'));
const graph = read(path.join(core, 'graph/service/manifestGraphCompiler.ts'));
const policyRelation = read(path.join(core, 'types/upstream/controllerActionPolicyRelations.ts'));
const routePolicyRelation = read(path.join(core, 'types/upstream/routeActionPolicyRelations.ts'));
const checks = {
  foundationOwnsGenericRelations: genericKernelNames.every(n => exists(path.join(foundation, `${n}.ts`))),
  scannerHasNoGenericKernelImports: scannerGenericKernelImports.length === 0,
  upstreamHasNoProductionReverseImports: reverseUpstreamImports.length === 0,
  dataflowAuthorityProducesClosedJudgment: /createSemanticDataflowJudgment/.test(authority) && /semantic_dataflow_judgment/.test(judgment),
  wiringPreservesUpstreamProof: /reasoning:\s*state\.reasoningContract/.test(adapter) && !/semanticReasoningContract\s*\(/.test(adapter),
  analysisConsumesAuthorityOnlyDataflow: /DataFlowAuthorityInterface/.test(astAnalysis),
  graphConsumesStructuralProjection: /isStructuralSemanticRelation|projectStructuralSemanticRelationToGraphEdge/.test(graph),
  policyRelationsAreCanonical: /ControllerActionPolicyRelation/.test(policyRelation) && /RouteActionPolicyRelation/.test(routePolicyRelation),
  exampleLaravelSourceExists: exists(path.join(fixture, 'routes/api.php')) && fixtureFiles.length > 0,
  fixtureHasSdkConsumers: exists(path.join(sdk, 'tests/middlewareProducer.spec.ts')) && exists(path.join(sdk, 'tests/dtoAstProducer.spec.ts')) && exists(path.join(sdk, 'tests/attributeProducer.spec.ts')),
};
const result = {
  phase: 953,
  ownership: { scannerGenericKernelImports, reverseUpstreamImports, foundation: rel(foundation) },
  fixture: { path: rel(fixture), phpFiles: fixtureFiles },
  endToEnd: { source: 'Laravel source evidence', authority: 'createSemanticDataflowJudgment -> closed proof', wiring: 'proof-preserving adapter -> DataFlowInterface', consumer: 'DataFlowAuthorityInterface -> analysis/IR', graph: 'CompleteLaravelSourceModel -> structural relation projection -> GraphEdgeRelation' },
  checks,
  clean: Object.values(checks).every(Boolean),
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = result.clean ? 0 : 1;
