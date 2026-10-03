const fs = require('fs');
const ts = require('typescript');

const files = [
  'packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts',
  'packages/core/src/compiler/scanner/lexer/phpMethodParser.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstFactory.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeBindingDeclarationAst.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts',
];

const diagnostics = files.map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  return { file, diagnostics: result.diagnostics?.length ?? 0 };
});

const result = {
  phase: 681,
  modifiedFiles: files.length,
  missing: files.filter((file) => !fs.existsSync(file)),
  diagnostics,
  status: diagnostics.every((item) => item.diagnostics === 0) && files.every((file) => fs.existsSync(file)) ? 'PASS' : 'FAIL',
};

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
