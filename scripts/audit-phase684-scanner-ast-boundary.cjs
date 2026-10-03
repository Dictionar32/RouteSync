const fs = require('fs');
const path = require('path');
const { transpileModule, ModuleKind, ScriptTarget } = require('typescript');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  'packages/core/src/compiler/scanner/symbols/model/index.ts',
];
const frontierFiles = [
  'packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts',
  'packages/core/src/compiler/scanner/lexer/tokenize/characterPredicates.ts',
  'packages/core/src/types/upstream/expression.ts',
  'packages/core/src/types/upstream/presence.ts',
  'packages/core/src/compiler/analysis/ssa/ssaRenamer.ts',
];
const forbiddenHost = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|null|any|new)\b|\?\?|===|as\s+unknown/g;
const strip = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')
  .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '');
const trace = rel => {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const result = transpileModule(source, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext, strict: true }, reportDiagnostics: true });
  const matches = [...strip(source).matchAll(forbiddenHost)].map(match => match[0]);
  return { file: rel, transpileDiagnostics: result.diagnostics?.length ?? 0, forbiddenHostConstructs: [...new Set(matches)].sort() };
};
console.log(JSON.stringify({
  phase: 684,
  authority: 'scanner-ast-semantic-boundary',
  repaired: files.map(trace),
  nextSemanticFrontier: frontierFiles.map(trace),
  astBoundary: {
    methodParsing: 'RelationOption<PhpMethodAst> via parsePhpMethod; no throw adapter in sourceAstScanner',
    alternatives: 'ADT narrowing before statement/block projection',
    finallyClause: 'absent | present narrowing with relationRefine',
    blocks: 'PhpBlock projected through its statements into statement-level semantic producers',
    modelSymbols: 'createModelSymbolTable exported through canonical model symbol interface barrel',
  },
  status: files.every(rel => { const t = trace(rel); return t.transpileDiagnostics === 0; }) ? 'PASS' : 'FRONTIER',
}, null, 2));
