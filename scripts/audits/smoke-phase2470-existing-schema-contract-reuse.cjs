const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};
const root = path.resolve(__dirname, '../..');
const { schemaRelationIndexFrom } = require(path.join(root, 'packages/core/src/types/upstream/schemaRelation.ts'));
const { createTableName } = require(path.join(root, 'packages/core/src/types/upstream/names.ts'));
const empty = { kind: 'empty' };
const source = { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: 'migration.php' } }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 1 } };
const tableName = createTableName('users');
const schemaTable = { kind: 'schema_table', table: tableName, columns: { kind: 'columns', items: empty }, indexes: { kind: 'indexes', items: empty }, foreignKeys: { kind: 'foreign_keys', items: empty }, migrationProvenance: empty, source };
const schema = { kind: 'schema_interface', definition: { kind: 'schema_definition', tables: { kind: 'schema_tables', items: { kind: 'cons', head: schemaTable, tail: empty } }, source }, source, closed: true };
const index = schemaRelationIndexFrom(schema);
const checks = [
  { name: 'existing schema index returns the matching SchemaTable', passed: index.schemaTable(tableName) === schemaTable },
  { name: 'existing schema index returns undefined for a missing table', passed: index.schemaTable(createTableName('orders')) === undefined },
  { name: 'existing relation lookup remains available', passed: index.table(tableName)?.table.value.value === 'users' },
];
const failed = checks.filter(item => !item.passed);
console.log(JSON.stringify({ phase: 2470, checks, passed: checks.length - failed.length, failed: failed.length }, null, 2));
process.exitCode = failed.length ? 1 : 0;
