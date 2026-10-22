const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/core/src/types/upstream/eloquentRelationMethodAuthority.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const transpiledModule = { exports: {} };
const execute = vm.runInThisContext(`(function(exports, require, module) { ${output}\n})`);
execute(transpiledModule.exports, require, transpiledModule);
const authority = transpiledModule.exports.eloquentRelationMethodAuthority;
const known = {
  hasOne: 'has_one', hasMany: 'has_many', belongsTo: 'belongs_to', belongsToMany: 'belongs_to_many',
  hasOneThrough: 'has_one_through', hasManyThrough: 'has_many_through', morphTo: 'morph_to',
  morphOne: 'morph_one', morphMany: 'morph_many', morphToMany: 'morph_to_many', morphedByMany: 'morphed_by_many',
};
let passed = 0;
for (const [name, type] of Object.entries(known)) {
  const result = authority.judge({ method: { kind: 'eloquent_relation_method_name', value: { kind: 'string_value', value: name } } });
  const ok = result.kind === 'recognized_eloquent_relation_method' && result.descriptor.type.kind === type;
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name} -> ${type}\n`);
  if (ok) passed += 1;
}
const unknown = authority.judge({ method: { kind: 'eloquent_relation_method_name', value: { kind: 'string_value', value: 'where' } } });
const unknownOk = unknown.kind === 'not_an_eloquent_relation_method';
process.stdout.write(`${unknownOk ? 'PASS' : 'FAIL'} unknown method -> not relation\n`);
if (unknownOk) passed += 1;
process.stdout.write(`Phase2465 method authority smoke: ${passed}/12 passed\n`);
process.exitCode = passed === 12 ? 0 : 1;
