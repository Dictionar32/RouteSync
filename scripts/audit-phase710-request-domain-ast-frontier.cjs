const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/descriptors/requestDescriptors.ts',
  'packages/core/src/compiler/scanner/descriptors/request/requestTypeDescriptor.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/projectors/FormModelProjector.ts',
  'packages/core/src/types/domain/request.ts',
];
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const syntax = source => ts.createSourceFile('audit.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics;
const stripped = source => source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
const counts = source => {
  const s = stripped(source);
  return Object.freeze({
    if: (s.match(/\bif\s*\(/g) || []).length,
    for: (s.match(/\bfor\s*\(/g) || []).length,
    while: (s.match(/\bwhile\s*\(/g) || []).length,
    switch: (s.match(/\bswitch\s*\(/g) || []).length,
    map: (s.match(/\.map\s*\(/g) || []).length,
    filter: (s.match(/\.filter\s*\(/g) || []).length,
    reduce: (s.match(/\.reduce\s*\(/g) || []).length,
    flatMap: (s.match(/\.flatMap\s*\(/g) || []).length,
    undefined: (s.match(/\bundefined\b/g) || []).length,
    null: (s.match(/\bnull\b/g) || []).length,
    strictEquality: (s.match(/===/g) || []).length,
    asUnknown: (s.match(/\bas\s+unknown\b/g) || []).length,
    any: (s.match(/\bany\b/g) || []).length,
    new: (s.match(/\bnew\s+/g) || []).length,
  });
};
const source = Object.fromEntries(files.map(file => [file, read(file)]));
const checks = {
  requestDescriptorUsesCanonicalIdentity: /identity:\s*RequestIdentity/.test(source[files[0]]) && !/resourceName:\s*string/.test(source[files[0]]),
  requestDescriptorCreatesCanonicalRequestType: /identity,\s*source,\s*actions,\s*response/.test(source[files[0]]),
  requestTypeHasNoLegacyResourceName: !/readonly\s+resourceName\b/.test(source[files[4]]),
  projectorReadsResourceFromIdentity: /reqType\.identity\.resource\.value\.value/.test(source[files[3]]) && !/reqType\.resourceName/.test(source[files[3]]),
  routeDomainCandidateIsClosed: /export type RouteDomainCandidateKind/.test(source[files[2]]) && /export interface RouteDomainCandidate/.test(source[files[2]]),
  routeDomainJudgmentCarriesCandidates: /readonly candidates: readonly RouteDomainCandidate\[\]/.test(source[files[2]]),
  routeDomainDoesNotUseRankTuples: !/type Candidate =/.test(source[files[2]]) && !/entry\[1\]/.test(source[files[2]]),
  allSyntaxValid: files.every(file => syntax(source[file]).length === 0),
};
const forbidden = Object.fromEntries(files.map(file => [file, counts(source[file])]));
const buildErrorSignaturesGone = !source[files[0]].includes('resourceName,\n        actions') && !source[files[2]].includes('entry[1]');
const report = { phase: 710, kind: 'request-domain-ast-highest-interface-frontier', checks, forbiddenConstructs: forbidden, buildErrorSignaturesGone, status: Object.values(checks).every(Boolean) && buildErrorSignaturesGone ? 'PASS' : 'FAIL' };
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
