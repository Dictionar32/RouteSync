const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['projection input is discriminated and carries canonical source identity', () => /interface SemanticKnowledgeEvidenceProjectionInput<TEvidence>[\s\S]*kind: 'semantic_knowledge_evidence_projection_input'[\s\S]*evidence: TEvidence[\s\S]*sourceFile: SourceFile[\s\S]*evidenceProvider: SemanticEvidenceProvider/.test(read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts'))],
  ['adapter contract uses a typed project operation, not positional produce arguments', () => /interface SemanticKnowledgeEvidenceAdapter<TEvidence>[\s\S]*readonly project:[\s\S]*SemanticKnowledgeEvidenceProjectionInput<TEvidence>[\s\S]*SemanticKnowledgeEvidenceProjection/.test(read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts')) && !/readonly produce:/.test(read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts'))],
  ['projection result binds source, provider, and canonical knowledge graph', () => /interface SemanticKnowledgeEvidenceProjection[\s\S]*sourceFile: SourceFile[\s\S]*evidenceProvider: SemanticEvidenceProvider[\s\S]*knowledge: SemanticKnowledgeDataFlow/.test(read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts'))],
  ['PHP AST adapter maps typed source/provenance into canonical producer', () => /producePhpAstSemanticKnowledgeDataFlow\([\s\S]*input\.sourceFile\.value\.value[\s\S]*input\.evidenceProvider\.code/.test(read('packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowProducer.ts'))],
  ['controller analyzer uses source-correlated project input', () => /semanticKnowledgeEvidenceAdapter\.project\([\s\S]*kind: 'semantic_knowledge_evidence_projection_input'[\s\S]*sourceFile: judgment\.sourceFile[\s\S]*evidenceProvider/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
  ['integrated response consumes exact projected knowledge and judgment response', () => /knowledge: semanticKnowledgeDataFlow, phpSourceInvocationPipeline: judgment\.response/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
  ['controller dataflow AST retains the complete source-correlated projection', () => /semanticKnowledgeProjection, semanticKnowledgeDataFlow, semanticVariables/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts')) && /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts'))],
  ['unused adapter is no longer passed into definition projection', () => !/canonicalDefinition\([^\n]*semanticKnowledgeEvidenceAdapter/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
  ['contract interface and value version are synchronized to 86', () => { const source = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'); return /readonly version: 86;/.test(source) && /version: 86,/.test(source); }],
  ['contract documents typed projection provenance', () => { const source = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'); return source.includes('controllerDataflowKnowledgeEvidenceProjectionBoundary') && source.includes('projection-output-keeps-source-identity-provider-provenance-and-canonical-SemanticKnowledgeDataFlow-in-one-value'); }],
  ['legacy helper remains a compatibility facade over the typed contract', () => /return phpAstSemanticKnowledgeEvidenceAdapter\.project\([\s\S]*sourceFile: createSourceFile\(filePath\)[\s\S]*\.knowledge/.test(read('packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowProducer.ts'))],
];
let failed = 0;
for (const [name, check] of checks) {
  const passed = Boolean(check());
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`\nPhase 1920 static audit: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
