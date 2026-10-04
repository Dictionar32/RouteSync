const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = {
  routeConstraintValuesConsumeBrandedAstDirectly: source.includes("semanticStringValue(value))"),
  routeConstraintPatternConsumesBrandedAstDirectly: source.includes("semanticStringValue(pattern.value)"),
  groupPendingSelectionUsesPresenceFold: source.includes('value => presenceFold(value, () => absent<GroupPendingKey>()'),
  groupPendingNoPresenceValueLeak: !source.includes('value => present(value.value),'),
  noParsedDescriptor: !/Parsed[A-Za-z0-9_]*Descriptor/.test(source),
};
console.log(JSON.stringify({checks, allPass:Object.values(checks).every(Boolean)}, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
