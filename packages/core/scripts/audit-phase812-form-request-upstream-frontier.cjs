const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/subscanners/FormRequestScanner.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['usesCanonicalRequestNameFactory', source.includes("createRequestName(sourceName)")],
  ['methodNamesConsumeAstIdentifierDirectly', source.includes("relationEqual(method.name, 'rules')") && source.includes("relationEqual(method.name, 'authorize')")],
  ['rulesNameConsumesAstIdentifierDirectly', source.includes('resolveRulesReturnIndex(tokens, rules.name)')],
  ['sourceFileConsumesStringValuePayload', source.includes('source.sourceFile.value.value')],
  ['nestedRelationOptionFoldEliminated', !source.includes('relationOptionFold(\n                    relationOptionFold(')],
  ['lexerImportPointsToCanonicalScanner', source.includes("import('../LaravelSourceLexer').TokenDescriptor")],
  ['noParsedDescriptorVocabulary', !/Parsed[A-Za-z]+Descriptor/.test(source)],
  ['noHostCastFallback', !/as unknown|as any|as never/.test(source)],
  ['noForbiddenSemanticIteration', !/\.(map|filter|reduce|flatMap)\s*\(/.test(source)],
  ['noForbiddenHostAbsence', !/\bundefined\b|\?\?/.test(source)],
];
const result = Object.fromEntries(checks);
result.allPass = checks.every(([, pass]) => pass);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allPass ? 0 : 1;
