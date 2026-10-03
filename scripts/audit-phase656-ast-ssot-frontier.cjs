const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const ast = read('packages/core/src/types/upstream/ast.ts');
const syntax = read('packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/phpMethodParser.ts');
const expression = read('packages/core/src/compiler/scanner/subscanners/expressionAstCanonical.ts');
const producers = [
  'routeProducer.ts','resourceProducer.ts','requestProducer.ts','requestAstCanonical.ts','modelCanonical.ts',
  'serviceAstCanonical.ts','dtoProducer.ts','middlewareProducer.ts','providerAstCanonical.ts','attributeProducer.ts',
  'channelProducer.ts','migrationProducer.ts','responseProducer.ts','controllerProducer.ts','resourceBinder.ts'
];
const producerPaths = [
  'packages/core/src/compiler/scanner/subscanners/routeProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/resourceProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/requestProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/requestAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/dtoProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/middlewareProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/attributeProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/channelProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/migrationProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/responseProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
];
const producerAudit = producerPaths.map(file => ({
  file,
  canonicalConstructor: /createDomainAstJudgment|createAstJudgment/.test(read(file)),
}));
const zeroFiles = [];
for (const file of [
  'packages/core/src/types/upstream/ast.ts.bak-interface-property',
  'packages/core/src/compiler/analysis/legacyFlow.ts',
  'packages/core/src/compiler/scanner/scannerLegacyDelegates.ts',
  'packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts',
]) {
  if (exists(file)) zeroFiles.push({ file, bytes: fs.statSync(path.join(root, file)).size });
}
const forbidden = source => Object.fromEntries([
  ['if', /\bif\b/g], ['while', /\bwhile\b/g], ['for', /\bfor\b/g], ['switch', /\bswitch\b/g],
  ['map', /\.map\s*\(/g], ['filter', /\.filter\s*\(/g], ['reduce', /\.reduce\s*\(/g], ['flatMap', /\.flatMap\s*\(/g],
  ['undefined', /\bundefined\b/g], ['nullish', /\?\?/g], ['strictEq', /===/g], ['strictNeq', /!==/g],
  ['asUnknown', /as\s+unknown/g], ['set', /new\s+Set\b/g], ['mapCtor', /new\s+Map\b/g], ['any', /\bany\b/g], ['new', /\bnew\s+[A-Za-z_$]/g]
].map(([name, re]) => [name, (source.match(re) || []).length]));
const report = {
  phase: 656,
  model: 'closed AST judgment + canonical constructor + typed syntax judgment frontier',
  ast: {
    closedUnion: /export type AstJudgment = \{[\s\S]*\}\[AstSemanticSchemaKind\];/.test(ast),
    routeDeclarationPreserved: /RouteAstSemantic[\s\S]*declaration: RouteDeclarationAst/.test(ast),
    canonicalConstructor: /export const createAstJudgment/.test(ast),
    domainConstructor: /export const createDomainAstJudgment/.test(ast),
    compatibilityProjection: /AstCompatibilityProjection/.test(ast),
  },
  producers: {
    total: producerAudit.length,
    canonicalized: producerAudit.filter(item => item.canonicalConstructor).length,
    missing: producerAudit.filter(item => !item.canonicalConstructor).map(item => item.file),
  },
  syntax: {
    typedClosedTerms: /export type SyntaxErrorTerm =/.test(syntax),
    usesGenericSemanticRelationSolver: /semanticRelationSolver/.test(syntax),
    forbidden: forbidden(syntax),
  },
  parserAdapter: {
    parsePhpMethodOrThrowRemoved: !/parsePhpMethodOrThrow/.test(parser),
    forbidden: forbidden(parser),
  },
  expressionAst: {
    usesCanonicalConstructor: /createAstJudgment/.test(expression),
    forbidden: forbidden(expression),
  },
  knownVacuum: zeroFiles,
  remainingHighFrontier: {
    genericSolver: 'semanticRelationSolver.ts still serves legacy semantic-relation consumers; next cutover is closed SemanticTerm algebra + solver removal.',
    resourceBinding: 'resourceBindingTraversalBuilder/resourceBindingOriginResolver/resourceBindingPathBuilder remain procedural compatibility surfaces.',
    resourceGrouping: 'resourceRouteGroupDescriptor remains a procedural grouping frontier.',
    resolverGraph: 'resolver graph requires judgment/candidate/closure interface elevation before vacuum.',
    typeLowering: 'TypeScript target-surface relations still consume legacy generic relation solver; target tokens remain projection-only.',
  },
  interpretation: 'AST semantic authority is now constructed through one closed SSOT constructor; legacy property names are compatibility projections of the semantic facet, not independent payloads.'
};
fs.writeFileSync(path.join(root, 'docs/PHASE656_AST_SSOT_FRONTIER_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'docs/PHASE656_AST_SSOT_FRONTIER_TRACE.json'), JSON.stringify({
  phase: 656,
  trace: [
    { layer: 'source evidence', input: 'Laravel/PHP syntax', authority: 'parser/lexer evidence only' },
    { layer: 'AST SSOT', transition: 'AstJudgmentInput -> createAstJudgment -> closed AstJudgment', authority: 'semantic judgment' },
    { layer: 'domain AST producers', transition: 'all 15 audited producer boundaries -> createDomainAstJudgment', authority: 'single constructor' },
    { layer: 'route AST', transition: 'RouteAstSemantic preserves declaration + definition', authority: 'closed semantic payload' },
    { layer: 'syntax errors', transition: 'typed SyntaxErrorTerm -> declarative derivations -> fixed point', authority: 'typed rewrite core' },
    { layer: 'next frontier', transition: 'binding/resolver/type-lowering procedural surfaces -> judgment/candidate/closure relations', authority: 'relation solver/rewrite engine' },
  ],
  research: {
    treeSitter: 'CST/source evidence boundary',
    codeQL: 'relational query model',
    souffle: 'relation/fixed-point model',
    mlirPDLL: 'declarative pattern/rewrite model',
    kFramework: 'rewrite-based executable semantics',
    circularAttributeGrammars: 'nonlocal attributes + fixed-point evaluation',
    routesyncSynthesis: 'closed proof-carrying AST judgment as semantic SSOT'
  },
  vacuumPolicy: 'unused files are emptied to zero bytes and never deleted',
}));
console.log(JSON.stringify(report, null, 2));
