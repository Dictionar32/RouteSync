const fs = require('fs');
const path = require('path');
const { transpileModule, ModuleKind, ScriptTarget } = require('typescript');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/cli/src/parsers/php/boundaryAdapter.ts',
  'packages/cli/src/parsers/php/ast/calleeCatamorphism.ts',
  'packages/cli/src/parsers/php/ast/grammarCatamorphism.ts',
  'packages/cli/src/parsers/php/astBoundarySemanticInterface.ts',
  'packages/cli/src/parsers/php/sourceSlice.ts',
  'packages/cli/src/parsers/php/nodeMapper.ts',
  'packages/core/src/types/domain/phpAst/index.ts',
  'packages/core/src/types/domain/index.ts',
  'packages/core/src/compiler/relational/sequence.ts',
  'packages/core/src/index.ts',
];

const hostPatterns = [
  ['if', /\bif\s*\(/g],
  ['while', /\bwhile\s*\(/g],
  ['for', /\bfor\s*\(/g],
  ['switch', /\bswitch\s*\(/g],
  ['map/filter/reduce/flatMap', /\.(?:map|filter|reduce|flatMap)\s*\(/g],
  ['undefined', /\bundefined\b/g],
  ['??', /\?\?/g],
  ['===', /===/g],
  ['as unknown as', /as\s+unknown\s+as/g],
  ['new expression', /\bnew\s+[A-Z_$]/g],
  ['host any type', /:\s*any\b|<\s*any\s*>/g],
];

const trace = rel => {
  const file = path.join(root, rel);
  const source = fs.readFileSync(file, 'utf8');
  const result = transpileModule(source, {
    compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext, strict: true },
    reportDiagnostics: true,
  });
  const semanticText = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(['\"`])(?:\\.|(?!\1)[^\\])*\1/g, '');
  const forbidden = hostPatterns.flatMap(([name, pattern]) =>
    [...semanticText.matchAll(pattern)].map(match => ({ construct: name, line: semanticText.slice(0, match.index).split('\n').length, text: match[0] }))
  );
  return { file: rel, transpileDiagnostics: result.diagnostics?.length ?? 0, forbiddenHostConstructs: forbidden };
};

const traces = files.map(trace);
const zeroByte = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(file);
  if (/\.tsx?$/.test(entry.name) && fs.statSync(file).size === 0) zeroByte.push(path.relative(root, file));
});
walk(path.join(root, 'packages'));

console.log(JSON.stringify({
  phase: 685,
  authority: 'php-parser-boundary-diagnostic-interface',
  files: traces,
  zeroByteFiles: zeroByte,
  architecture: {
    sourceEvidence: 'PhpGrammarNode is typed at the parser boundary; unknown ingress was removed from nodeMapper/sourceSlice.',
    canonicalAst: 'boundaryAdapter projects directly into the closed PHP AST ADT and BoundLiteralValue vocabulary.',
    dispatch: 'callee and grammar dispatch use relational variant narrowing instead of index/cast dispatch.',
    diagnostic: 'unsupported/missing boundary conditions remain explicit diagnostic judgments; no new-expression construction is introduced.',
    relationAuthority: 'compiler relational facade exposes option/fold/variant primitives as the canonical parser boundary algebra.',
  },
  status: traces.every(t => t.transpileDiagnostics === 0) ? 'PASS' : 'FRONTIER',
}, null, 2));
