const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};
const root = path.resolve(__dirname, '../..');
const names = require(path.join(root, 'packages/core/src/types/upstream/names.ts'));
const authority = require(path.join(root, 'packages/core/src/types/upstream/eloquentRelationFactsAuthority.ts')).eloquentRelationFactsAuthority;
const method = value => ({ kind: 'eloquent_relation_method_name', value: { kind: 'string_value', value } });
const source = { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: 'app/Models/User.php' } }, start: { kind: 'number_value', value: 10 }, end: { kind: 'number_value', value: 60 } };
const base = { kind: 'eloquent_relation_facts_evidence', method: method('hasMany'), relationName: names.createRelationName('posts'), sourceModel: names.createModelName('User'), target: { kind: 'explicit_class_target', targetClass: names.createClassName('Post') }, invocation: { kind: 'literal', value: { kind: 'string_value', value: 'this->hasMany(Post::class)' } }, source, keyArguments: { kind: 'eloquent_relation_key_arguments_evidence', second: { kind: 'argument_absent' }, third: { kind: 'argument_absent' } } };
const checks = [
  ['hasMany produces canonical relation AST', authority.judge(base).kind === 'eloquent_relation_facts_produced'],
  ['hasMany cardinality is collection', authority.judge(base).kind === 'eloquent_relation_facts_produced' && authority.judge(base).relation.targetShape.kind === 'collection'],
  ['hasMany relation type is preserved', authority.judge(base).kind === 'eloquent_relation_facts_produced' && authority.judge(base).relation.eloquentType.kind === 'has_many'],
  ['unknown method is rejected as not relation', authority.judge({ ...base, method: method('where') }).kind === 'not_an_eloquent_relation'],
  ['recognized method without explicit target is closed unsupported judgment', authority.judge({ ...base, target: { kind: 'missing_class_target' } }).kind === 'unsupported_eloquent_relation'],
];
for (const [label, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, ok]) => !ok);
process.stdout.write(`Phase2466 authority smoke: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length ? 1 : 0;
