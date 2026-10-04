const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cursor = path.join(root, 'packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts');
const delimiter = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/delimiterNavigation.ts');
const source = fs.readFileSync(cursor, 'utf8');
const delimiterSource = fs.readFileSync(delimiter, 'utf8');
const checks = [
  ['cursor uses upstream Presence', source.includes("from '../../../types/upstream/presence'"), ''],
  ['CursorPresence aliases upstream Presence', /export type CursorPresence<T> = Presence<T>;/.test(source), ''],
  ['cursor uses presenceFold', source.includes('presenceFold('), ''],
  ['cursor has no duplicate present/absent ADT declaration', !/export type CursorPresence<T> =\s*\|\s*\{ readonly kind: 'absent' \}/.test(source), ''],
  ['delimiter input is RelationOption', /export type DelimiterInput = RelationOption<string>/.test(delimiterSource), ''],
  ['delimiter catalog excludes other variant', /type MappedDelimiterRelation = Exclude<DelimiterRelation/.test(delimiterSource), ''],
  ['no Parsed*Descriptor authority in cursor', !/Parsed[A-Za-z0-9_]*Descriptor/.test(source), ''],
  ['no host absence/control/combinator vocabulary in cursor', !/\b(if|while|for|switch|unknown|any|null)\b|\?\?|===|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\sas\s/.test(source), ''],
];
const failed = checks.filter(([, ok]) => !ok);
console.log(JSON.stringify({phase:794, checks, allPass: failed.length === 0}, null, 2));
process.exitCode = failed.length ? 1 : 0;
