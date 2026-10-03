const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch)\s*\(|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|===|!==|as\s+unknown|new\s+(Set|Map)\b|\bany\b|as\s+Extract/;
const files = [
  'packages/core/src/semantic/kernel/relationalSequence.ts',
  'packages/core/src/types/upstream/presence.ts',
  'packages/core/src/compiler/scanner/lexer/tokenEvidence.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts',
  'packages/core/src/compiler/scanner/descriptors/route/routeMethods.ts',
];
const counts = Object.fromEntries(files.map(file => [file, [...read(file).matchAll(new RegExp(forbidden.source, 'g'))].length]));
const relation = read('packages/core/src/semantic/kernel/relationalSequence.ts');
const presence = read('packages/core/src/types/upstream/presence.ts');
const domain = read('packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts');
const token = read('packages/core/src/compiler/scanner/lexer/tokenEvidence.ts');
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
].every(file => size(file) === 0);
const inactive = JSON.parse(require('child_process').execFileSync(process.execPath, [path.join(root, 'scripts/audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
const relationVariantClosed = ['RelationVariant', 'relationVariant'].every(term => relation.includes(term));
const presenceClosed = ['Presence<T>', 'presenceOf', 'mapPresenceValue', 'presenceFold', 'bindPresence'].every(term => presence.includes(term))
  && !presence.includes('fromOptional')
  && !presence.includes('mapOptional')
  && !presence.includes('flatMapPresence');
const domainClosed = ['RouteDomainResolutionContext', 'RelationOption<DomainTypeName>', 'candidateFromOption', 'resolveRouteDomain'].every(term => domain.includes(term))
  && !domain.includes('readonly domain?')
  && !domain.includes('readonly resourceName?')
  && !domain.includes('readonly controllerName?')
  && !domain.includes('readonly path?')
  && !domain.includes('readonly actionName?');
const tokenClosed = ['TokenEvidenceJudgment', 'TokenEvidenceInterface', 'tokenValueEquals', 'tokenKindEquals'].every(term => token.includes(term));
const result = {
  phase: 668,
  model: 'highest AST interface closure: relation-variant algebra + explicit Presence ADT + closed route-domain resolver boundary',
  relationVariantClosed,
  presenceClosed,
  routeDomainInterfaceClosed: domainClosed,
  tokenInterfaceClosed: tokenClosed,
  legacySolverAndSyntaxCoreEmpty: legacy,
  inactiveVacuum: inactive.allCandidatesEmpty === true,
  boundaryForbidden: counts,
  cleanBoundary: Object.values(counts).every(value => value === 0),
  inactiveCandidates: inactive.candidates,
};
result.success = relationVariantClosed && presenceClosed && domainClosed && tokenClosed && legacy && result.inactiveVacuum && result.cleanBoundary;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
