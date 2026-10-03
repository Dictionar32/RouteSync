const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const controllerPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const routePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const syntaxPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxValue.ts');
const archivePaths = [
  path.join(root, 'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts'),
  path.join(root, 'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts'),
];
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const controller = fs.readFileSync(controllerPath, 'utf8');
const route = fs.readFileSync(routePath, 'utf8');
const syntax = fs.readFileSync(syntaxPath, 'utf8');
const archivesEmpty = archivePaths.every(file => fs.statSync(file).size === 0);

const productionParsedAstRefs = fs.readdirSync(path.join(root, 'packages/core/src/types/semantic'), { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
  .flatMap(entry => fs.readFileSync(path.join(root, 'packages/core/src/types/semantic', entry.name), 'utf8').match(/ParsedASTNode|ParsedASTVisitor|matchParsedAST/g) || []);

const forbiddenChangedFilePattern = /\bas unknown\b|\bundefined\b|\?\?|===|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bany\b/;
const checks = {
  controllerUsesCanonicalRelationOption: controller.includes('relationSome') && controller.includes('relationNone'),
  controllerUsesTypedArrayEntryRefinement: controller.includes("RelationVariant<PhpArrayEntry, 'keyed'>"),
  controllerUsesTypedLiteralRefinement: controller.includes("literalType: 'string'"),
  controllerNoLegacyOptionValueAccess: !controller.includes("someBranch(option.value)"),
  routeUsesCursorWitness: route.includes('findWitness('),
  routeNoUntypedFindReturn: !route.includes("ReturnType<TokenCursor['find']>"),
  routeReturnsReadonlyMiddleware: route.includes('readonly MiddlewareNameAst[]'),
  syntaxKindGroupsTyped: syntax.includes("readonly SyntaxTokenFact['kind'][]"),
  syntaxOperationGroupsTyped: syntax.includes('readonly SyntaxOperation[]'),
  archivedParsedAstFilesEmpty: archivesEmpty,
  activeParsedAstReferencesZero: productionParsedAstRefs.length === 0,
  changedFilesNoSelectedHostLeak: !forbiddenChangedFilePattern.test(controller) && !forbiddenChangedFilePattern.test(route),
  auditRegistered: pkg.scripts['audit:phase736-scanner-ast-interface'] === 'node scripts/audit-phase736-scanner-ast-interface.cjs',
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 736, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
