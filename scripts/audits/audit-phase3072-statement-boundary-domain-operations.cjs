const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const target = 'packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts';
const source = fs.readFileSync(path.join(root, target), 'utf8');
const transpiled = ts.transpileModule(source, {
  fileName: path.join(root, target),
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
});
const syntaxDiagnostics = (transpiled.diagnostics ?? []).map(diagnostic => ({
  code: diagnostic.code,
  message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
}));
const runtimeModule = { exports: {} };
new Function('exports', 'require', 'module', transpiled.outputText)(runtimeModule.exports, require, runtimeModule);
const runtime = runtimeModule.exports;
const resolve = (tokens, start = 0) => runtime.scannerStatementBoundaryAlgebra.resolve({ tokens, start, tokenValue: token => token });
const equal = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  genericContinuationRemovedFromBoundaryDomain: !/continueWith\s*:|\.continueWith\s*</.test(source),
  genericHandlerBundleRemoved: !/onTerminator|onMalformed|onEnd|<Result>/.test(source),
  delimiterRecognitionIsClosedTypedJudgment: /type DelimiterJudgment\s*=/.test(source) && /kind: 'opener'/.test(source) && /kind: 'closer'/.test(source) && /kind: 'ordinary'/.test(source),
  statementPositionIsClosedTypedJudgment: /type StatementPositionJudgment\s*=/.test(source) && /kind: 'top_level_terminator'/.test(source),
  cursorValidityUsesDomainOperation: /type StartCursorJudgment\s*=/.test(source) && /toStatementBoundaryResolution/.test(source),
  canonicalRuntimeExportIsInterfaceFirst: /export const scannerStatementBoundaryContractAlgebra:\s*ScannerStatementBoundaryInterface\s*= Object\.freeze/.test(source),
  compatibilityRuntimeExportIsInterfaceFirst: /export const scannerStatementBoundaryAlgebra:\s*StatementBoundaryAlgebra\s*= Object\.freeze/.test(source),
  noExportedFunctionDeclarations: !/^export\s+function\s+/m.test(source),
  terminatorRuntimeFixture: equal(resolve(['call', '(', 'a', ';', 'b', ')', ';', 'tail']), { kind: 'terminator', index: 6, state: { parentheses: 0, brackets: 0, braces: 0 } }),
  endOfInputRuntimeFixture: equal(resolve(['return', 'value']), { kind: 'end_of_input', index: 2, state: { parentheses: 0, brackets: 0, braces: 0 } }),
  unexpectedCloserRuntimeFixture: equal(resolve(['a', ')', ';']), { kind: 'malformed', index: 1, actual: ')', reason: 'unexpected_closer' }),
  mismatchedCloserRuntimeFixture: equal(resolve(['(', '[', ')', ']', ';']), { kind: 'malformed', index: 2, expected: ']', actual: ')', reason: 'mismatched_closer' }),
  unclosedDelimiterRuntimeFixture: equal(resolve(['a', '{', 'b']), { kind: 'malformed', index: 3, expected: '}', actual: '<end-of-input>', reason: 'unclosed_delimiter' }),
  invalidCursorRuntimeFixture: equal(resolve(['a'], -1), { kind: 'malformed', index: -1, expected: '<valid-index>', actual: '-1', reason: 'invalid_start' }),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  changedFileTranspilesWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
};
const regressions = [
  ['phase3071', 'scripts/audits/audit-phase3071-scanner-control-domain-operations.cjs'],
  ['phase3070', 'scripts/audits/audit-phase3070-controller-invocation-input-domain-operations.cjs'],
  ['phase3069', 'scripts/audits/audit-phase3069-integration-to-controller-judgment-domain-operation.cjs'],
].map(([phase, script]) => {
  const run = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, encoding: 'utf8' });
  return { phase, status: run.status === 0 ? 'PASS' : 'FAIL', output: `${run.stdout || ''}${run.stderr || ''}`.slice(-1200) };
});
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3072,
  title: 'Fully Explicit Typed Runtime Scanner Operations — statement-boundary domain operations',
  status: failed.length === 0 && regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions,
  runtimeTrace: [
    'The PHP AST runtime consumes scannerStatementBoundaryContractAlgebra.resolve with source tokens and a token-to-source-spelling operation.',
    'The canonical upstream algebra classifies each token position into a typed statement-position judgment and a typed delimiter judgment.',
    'The traversal resolves terminator, end-of-input, unexpected closer, mismatched closer, and unclosed delimiter outcomes while preserving token evidence.',
    'The compatibility facade translates the canonical judgment into the existing index/state result contract for legacy consumers.',
    'The CLI manifest scan continues through the existing AST/runtime and manifest composition path; this phase does not claim a full PHP-to-manifest end-to-end execution.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    runtimeFixtures: Object.entries(checks).filter(([name]) => name.endsWith('RuntimeFixture')).every(([, pass]) => pass) ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressions: regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
    strictTypeScript: 'NOT_CLAIMED — transpilation and direct runtime fixtures do not establish whole-program type correctness.',
    vitest: 'NOT_RUN — workspace Vitest installation is incomplete; equivalent focused boundary fixtures were executed against transpiled output.',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    globalPrimitiveElimination: 'NOT_CLAIMED — the compatibility facade intentionally retains its legacy cursor/index contract; parser traversal mechanics remain explicit and typed.',
  },
  remainingRisks: [
    'Legacy compatibility API still represents cursor and delimiter-state information using primitive values; removing these would require a consumer migration rather than a local rewrite.',
    'The runtime scan still uses ordinary branching to execute traversal. Semantic categories are modeled as closed judgments, but this is not a claim that every control-flow operator has been eliminated.',
    'The source-project identity boundary and complete PHP → CLI → manifest/IR path remain outside this phase.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
for (const regression of regressions) console.log(`${regression.phase} regression: ${regression.status}`);
if (syntaxDiagnostics.length) console.error(JSON.stringify(syntaxDiagnostics, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3072_STATEMENT_BOUNDARY_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
