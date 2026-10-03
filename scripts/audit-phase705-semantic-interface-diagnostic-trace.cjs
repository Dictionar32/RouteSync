const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = [
  'packages/core/src/compiler/scanner/lexer/index.ts',
  'packages/core/src/compiler/scanner/lexer/responseDtoAstTypes.ts',
  'packages/core/src/compiler/scanner/lexer/responseDtoDeclarationParser.ts',
  'packages/core/src/compiler/scanner/subscanners/dtoProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/responseProducer.ts',
  'packages/core/src/types/upstream/typeVocabulary.ts',
  'packages/core/src/types/upstream/astSemanticInterface.ts',
  'packages/core/src/compiler/diagnostics/Diagnostic.ts',
  'packages/core/src/compiler/diagnostics/DiagnosticBag.ts',
];
const diagnostics = [];
for (const file of files) {
  const source = read(file);
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, strict: true },
    reportDiagnostics: true,
    fileName: file,
  });
  for (const diagnostic of result.diagnostics || []) {
    diagnostics.push({ file, code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ') });
  }
}
const lexerIndex = read('packages/core/src/compiler/scanner/lexer/index.ts');
const responseTypes = read('packages/core/src/compiler/scanner/lexer/responseDtoAstTypes.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/responseDtoDeclarationParser.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/dtoProducer.ts');
const responseProducer = read('packages/core/src/compiler/scanner/subscanners/responseProducer.ts');
const typeVocabulary = read('packages/core/src/types/upstream/typeVocabulary.ts');
const astInterface = read('packages/core/src/types/upstream/astSemanticInterface.ts');
const diagnostic = read('packages/core/src/compiler/diagnostics/Diagnostic.ts');
const diagnosticBag = read('packages/core/src/compiler/diagnostics/DiagnosticBag.ts');

const report = {
  phase: 705,
  kind: 'semantic-interface-diagnostic-trace',
  buildFrontier: {
    duplicatePhpPropertyTypeExportRemoved: !/ResponseDtoDeclarationAst,\s*ResponseDtoPropertyAst,\s*PhpPropertyTypeAst/.test(lexerIndex),
    responseDtoOwnTypeAlgebraRemoved: !/export type PhpPropertyTypeAst/.test(responseTypes),
    responseDtoUsesCanonicalTypeExpression: /TypeExpression/.test(responseTypes) && /type:\s*TypeExpression/.test(responseTypes),
    parserProducesCanonicalTypeExpression: /parsePropertyType\(value: string\): TypeExpression/.test(parser),
    dtoProducerConsumesCanonicalTypeExpression: /type:\s*TypeExpression/.test(producer),
    responseProducerConsumesCanonicalTypeExpression: /TypeExpression/.test(responseProducer),
  },
  astInterface: {
    closedStages: /export type AstSemanticStage\s*=/.test(astInterface),
    closedFacts: /export type AstSemanticFact\s*=/.test(astInterface),
    closure: /export type AstSemanticClosure\s*=/.test(astInterface) && /relationFixedPoint/.test(astInterface),
    projection: /export type AstSemanticProjection\s*=/.test(astInterface),
  },
  diagnostic: {
    closedLocation: /type DiagnosticLocation\s*=/.test(diagnostic),
    closedFix: /type DiagnosticFixState\s*=/.test(diagnostic),
    gate: /type DiagnosticGate\s*=/.test(diagnosticBag),
    gateEvaluation: /evaluateGate/.test(diagnosticBag),
  },
  canonicalTypeVocabulary: {
    typeExpression: /export type TypeExpression\s*=/.test(typeVocabulary),
    nullableVariant: /kind: 'nullable'/.test(typeVocabulary),
    referenceVariant: /kind: 'reference'/.test(typeVocabulary),
  },
  transpileDiagnostics: diagnostics,
};
report.status = diagnostics.length === 0 && Object.values(report.buildFrontier).every(Boolean)
  && Object.values(report.astInterface).every(Boolean)
  && Object.values(report.diagnostic).every(Boolean)
  && Object.values(report.canonicalTypeVocabulary).every(Boolean)
  ? 'PASS' : 'FAIL';
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
