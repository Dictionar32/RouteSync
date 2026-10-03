const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = {
  ast: 'packages/core/src/types/upstream/ast.ts',
  target: 'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
  syntaxError: 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
};
const forbidden = /\b(?:if|while|for|switch)\s*\(|\b(?:map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|===|as unknown|:\s*any|\bnew\s+(?:Set|Map)\b/;
const count = (source, pattern) => (source.match(pattern) || []).length;
const ast = read(files.ast);
const target = read(files.target);
const syntaxError = read(files.syntaxError);
const zeroByte = [];
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const relative = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(relative) : [relative];
});
for (const file of walk('packages')) if (fs.statSync(path.join(root, file)).size === 0) zeroByte.push(file.replaceAll('\\', '/'));

const result = {
  phase: 657,
  model: 'closed proof-carrying AST algebra + target projection algebra',
  astInterface: {
    closedSchemaRegistry: /export type AstNodeSchema/.test(ast),
    closedJudgment: /export type AstJudgment =/.test(ast),
    constructorContract: /export type AstJudgmentConstructor/.test(ast),
    algebraInterface: /export type AstJudgmentAlgebra/.test(ast),
    closedEliminator: /export const matchAstJudgment/.test(ast),
    proofFacets: ['evidence','provenance','constraints','dependencies','relations','derivation','status','diagnostics'].every(x => new RegExp(`readonly ${x}:`).test(ast)),
    openGenericPayload: /Semantic, Surface, or Origin/.test(ast),
  },
  canonicalProducers: {
    total: 15,
    typedConstructorAssertionsRemoved: !/createDomainAstJudgment\([\s\S]{0,260}\)\s+as\s+(?:ModelAst|ResourceAst|RequestAst|RouteAst|ControllerAst|ResponseAst|ServiceAst|MigrationAst|DtoAst|MiddlewareAst|ProviderAst|AttributeAst|ChannelAst)/.test(read(files.ast)),
  },
  targetProjection: {
    closedFactAlgebra: /export type TypeScriptSurfaceFact/.test(target),
    genericSolverDependency: /semanticRelationSolver/.test(target),
    forbidden: {
      if: count(target, /\bif\s*\(/g), while: count(target, /\bwhile\s*\(/g), for: count(target, /\bfor\s*\(/g), switch: count(target, /\bswitch\s*\(/g),
      map: count(target, /\bmap\s*\(/g), filter: count(target, /\bfilter\s*\(/g), reduce: count(target, /\breduce\s*\(/g), flatMap: count(target, /\bflatMap\s*\(/g),
      undefined: count(target, /\bundefined\b/g), nullish: count(target, /\?\?/g), strictEq: count(target, /===/g), asUnknown: count(target, /as\s+unknown/g), any: count(target, /:\s*any\b/g), setMapCtor: count(target, /\bnew\s+(?:Set|Map)\b/g),
    },
  },
  syntaxErrorBoundary: {
    closedTerms: /export type SyntaxErrorTerm =/.test(syntaxError),
    fixedPoint: /relationFixedPoint/.test(syntaxError),
    genericSolverDependency: /semanticRelationSolver/.test(syntaxError),
  },
  inactiveVacuum: { zeroByteCount: zeroByte.length, zeroByteFiles: zeroByte },
};
console.log(JSON.stringify(result, null, 2));
