const fs = require('fs');
const path = require('path');
const { transpileModule, ModuleKind, ScriptTarget } = require('typescript');

const root = path.resolve(__dirname, '..');
const diagnosticFiles = [
  'packages/core/src/compiler/diagnostics/Diagnostic.ts',
  'packages/core/src/compiler/diagnostics/DiagnosticBag.ts',
  'packages/core/src/compiler/diagnostics/index.ts',
];

const forbiddenHost = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|any|new)\b|\?\?|===|as\s+unknown/g;
const strip = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')
  .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '');

const traces = diagnosticFiles.map(rel => {
  const file = path.join(root, rel);
  const source = fs.readFileSync(file, 'utf8');
  const result = transpileModule(source, {
    compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext, strict: true },
    reportDiagnostics: true,
  });
  const clean = strip(source);
  const matches = [...clean.matchAll(forbiddenHost)].map(match => match[0]);
  return {
    file: rel,
    transpileDiagnostics: result.diagnostics?.length ?? 0,
    forbiddenHostConstructs: [...new Set(matches)].sort(),
  };
});

console.log(JSON.stringify({
  phase: 683,
  authority: 'diagnostic-semantic-interface',
  files: traces,
  modifiedInterface: {
    diagnostic: 'closed Diagnostic ADT with explicit location/fix state',
    gate: 'accepted | rejected DiagnosticGate relation judgment',
    accumulation: 'immutable relation-backed DiagnosticBag',
  },
  status: traces.every(x => x.transpileDiagnostics === 0 && x.forbiddenHostConstructs.length === 0) ? 'PASS' : 'FRONTIER',
}, null, 2));
