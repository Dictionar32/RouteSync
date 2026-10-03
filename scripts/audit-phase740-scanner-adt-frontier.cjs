const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const ast = read('packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts');
const controller = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const model = read('packages/core/src/compiler/scanner/lexer/modelDeclarationParser.ts');
const modelTypes = read('packages/core/src/compiler/scanner/lexer/modelAstTypes.ts');

const checks = {
  phase: 740,
  astClassificationRuleIsNodeOption: /readonly resolve: \(tokens: readonly TokenDescriptor\[\]\) => RelationOption<PhpAstValueNode>/.test(ast),
  astValueClassifiersCrossNodeBoundary: /const nodeClassification =/.test(ast),
  astNoRelationNoneSentinelLeak: !ast.includes('RELATION_NONE'),
  astStructuredStatementsUseOptionAuthority: /type ParsedStatement =/.test(ast) && /function parseStructuredStatement[\s\S]*RelationOption<ParsedStatement>/.test(ast),
  astStructuredCandidatesUseOptionalSolver: /solveOptionalCandidate<ParsedStatement>/.test(ast),
  astSwitchKindIsOptionWitness: /activeKind: RelationOption<'case' \| 'default'>/.test(ast),
  astTryCatchesAreOptionWitness: /type ParsedTryCatches =/.test(ast) && /parseTryCatches[\s\S]*RelationOption<ParsedTryCatches>/.test(ast),
  controllerAcceptedMethodIsSome: /return relationGate\([\s\S]*return relationSome\(Object\.freeze\(/.test(controller),
  controllerRejectedMethodIsNone: /=> relationNone\(\)\);/.test(controller),
  controllerParameterNameUsesTextRelation: /createAstIdentifier\(relationTextSlice\(variableToken\.value, 1\)\)/.test(controller),
  controllerResponseCandidateUsesOptionFold: /return relationOptionFold\(candidate,/.test(controller),
  modelTokenUsesCanonicalLine: /value\.line/.test(model) && !model.includes('value.startLine'),
  modelMethodsUsePhpMethodEvidence: /parsePhpMethod\('', tokens, index\)/.test(model),
  modelMethodCandidateUsesVariantWitness: /relationVariantFold\(method, 'some'/.test(model),
  modelConstantCandidateUsesVariantWitness: /relationVariantFold\(constant, 'some'/.test(model),
  modelDeclarationCarriesDocumentationAndProperties: /documentation: \{ kind: 'absent'/.test(model) && /properties: Object\.freeze\(\[\]\)/.test(model),
  modelMethodTypeCarriesReturns: /readonly returns: readonly PhpAstValue\[\];/.test(modelTypes),
  modelMethodParametersUseScannerPhpParameterAst: /PhpParameterAst as PhpParameter/.test(modelTypes),
};

const failed = Object.entries(checks).filter(([key, value]) => key !== 'phase' && value === false).map(([key]) => key);
const result = { phase: checks.phase, checks, failed, pass: failed.length === 0 };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.pass ? 0 : 1;
