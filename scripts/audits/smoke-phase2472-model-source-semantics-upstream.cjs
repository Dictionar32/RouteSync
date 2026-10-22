const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};
const root = path.resolve(__dirname, '../..');
const { modelSourceSemanticsAuthority } = require(path.join(root, 'packages/core/src/types/upstream/modelSourceSemanticsAuthority.ts'));
const { createClassName, createMethodName, createSourceFile, stringValue } = require(path.join(root, 'packages/core/src/types/upstream/names.ts'));
const { numberValue } = require(path.join(root, 'packages/core/src/types/upstream/valueObjects.ts'));
const className = value => createClassName(value);
const source = { kind: 'source_span', file: createSourceFile('User.php'), start: numberValue(0), end: numberValue(20) };
const method = (returnType, name = 'posts') => ({ kind: 'model_method_source_evidence', name: createMethodName(name), visibility: { kind: 'public' }, returnType, body: { kind: 'source_statements', items: { kind: 'empty' } }, source });
const evidence = (returnType, inheritance = { kind: 'eloquent_model' }) => ({
  kind: 'model_source_semantics_evidence',
  inheritance,
  traits: [{ kind: 'trait_name', value: stringValue('HasFactory') }],
  methods: [method(returnType)],
  constants: [],
});
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const absent = modelSourceSemanticsAuthority.judge(evidence({ kind: 'absent' }));
const classRef = modelSourceSemanticsAuthority.judge(evidence({ kind: 'class_reference', name: className('Post') }));
const unsupported = modelSourceSemanticsAuthority.judge(evidence({ kind: 'unsupported_type_expression' }));
const inherited = modelSourceSemanticsAuthority.judge(evidence({ kind: 'absent' }, { kind: 'class', name: className('BaseModel') }));
check('absent method return annotation remains absent', absent.methods[0].result.kind === 'absent');
check('class-reference return annotation resolves to upstream class reference', classRef.methods[0].result.kind === 'present' && classRef.methods[0].result.type.value.name.value.value === 'Post');
check('unsupported return annotation is explicitly normalized by upstream authority', unsupported.methods[0].result.kind === 'present' && unsupported.methods[0].result.type.value.name.value.value === 'mixed');
check('inheritance and traits survive the upstream judgment', inherited.inheritance.kind === 'class' && inherited.inheritance.name.value.value === 'BaseModel' && inherited.capabilities.traits.items.kind === 'cons' && inherited.capabilities.traits.items.head.value.value === 'HasFactory');
const failed = checks.filter(item => !item.passed);
console.log(JSON.stringify({ phase: 2472, checks, passed: checks.length - failed.length, failed: failed.length }, null, 2));
process.exitCode = failed.length ? 1 : 0;
