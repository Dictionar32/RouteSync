const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const semantic = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts');
const semanticAnalyzer = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const upstreamController = read('packages/core/src/types/upstream/controller.ts');

const forbidden = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|null|any|new)\b|\?\.|===|\bas\b|unknown/;
const parsedAstAlgebra = read('packages/core/src/types/semantic/parsedAstAlgebra.ts');
const parsedAstTypes = read('packages/core/src/types/semantic/parsedAstTypes.ts');

const checks = {
  analyzerUsesCanonicalKnowledgeProducer: analyzer.includes("produceSemanticKnowledgeDataFlow(block, filePath)"),
  bindingFactsAreRefined: analyzer.includes("fact is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'binding' }>") ,
  referenceFactsAreRefined: analyzer.includes("fact is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'reference' }>") ,
  statementVariantsUseRelationRefinement: analyzer.includes('const assignmentStatement') && analyzer.includes('const foreachStatement') && analyzer.includes('const conditionalStatement'),
  valueLiteralUsesClosedRefinement: analyzer.includes('const isStringLiteral'),
  semanticPresenceUsesCanonicalFold: analyzer.includes('semanticPresenceFold('),
  semanticAccessIsClosedUpstreamAdt: upstreamController.includes('interface ControllerVariableDefinition') && semantic.includes('export type SemanticAccessMember ='),
  semanticPresenceFoldAuthorityExists: semantic.includes('export function semanticPresenceFold'),
  dataflowAnalyzerUsesPresenceFold: semanticAnalyzer.includes('semanticPresenceFold('),
  archivedParsedAstAlgebraEmpty: parsedAstAlgebra.length === 0,
  archivedParsedAstTypesEmpty: parsedAstTypes.length === 0,
  analyzerDoesNotIntroduceForbiddenHostConstructs: !forbidden.test(analyzer),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
const result = { phase: 739, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
