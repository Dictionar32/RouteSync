const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/core/src/types/upstream/eloquentRelationMethodAuthority.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
const syntaxErrors = (output.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
if (syntaxErrors.length > 0) throw new Error(ts.formatDiagnostics(syntaxErrors, { getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => '\n' }));
const moduleExports = {};
new Function('exports', output.outputText)(moduleExports);
const authority = moduleExports.eloquentRelationMethodAuthority;
const names = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'hasOneThrough', 'hasManyThrough', 'morphTo', 'morphOne', 'morphMany', 'morphToMany', 'morphedByMany'];
const method = value => ({ kind: 'eloquent_relation_method_name', value: { kind: 'string_value', value } });
let passed = 0;
for (const name of names) {
  const judgment = authority.judge({ method: method(name) });
  if (judgment.kind !== 'recognized_eloquent_relation_method' || authority.descriptor({ method: method(name) }).type.kind === undefined) throw new Error(`Expected recognized relation method: ${name}`);
  passed += 1;
}
if (authority.judge({ method: method('someOtherMethod') }).kind !== 'not_an_eloquent_relation_method') throw new Error('Unknown method must produce not_an_eloquent_relation_method');
passed += 1;
if (authority.type({ method: method('hasMany') }).kind !== 'has_many') throw new Error('hasMany type judgment changed');
passed += 1;
process.stdout.write(`Phase2465 smoke: ${passed}/${passed} passed\n`);
