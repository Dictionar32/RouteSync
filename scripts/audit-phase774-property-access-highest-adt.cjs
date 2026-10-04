const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/binders/resource/propertyAccessBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/fieldBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/whenLoadedSemanticBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/propertyPathBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/literalTernaryBinders.ts',
  'packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts',
];
const text = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]));
const property = text[files[0]];
const all = Object.values(text).join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const checks = {
  lookupNarrowedByMatch: property.includes('matchLookup(modelSymbol.resolveProperty(propertyName)') && property.includes('lookup => bindResolved(key, access, modelSymbol, lookup.value)'),
  resolvedBindingIsCanonicalAdt: property.includes('binding: ResolvedPropertyBinding') && property.includes("'column'") && property.includes("'accessor'") && property.includes("bindRelation(key, modelSymbol, relation, access)"),
  noAdtStringRoundtrip: !/ResolvedPropertyBinding[^\n]*string|binding\.value\.value[^\n]*createPropertyName/.test(property),
  accessModeIsClosedAst: property.includes('access: PhpAccessMode') && !property.includes('isNullsafe: boolean'),
  resultUsesCanonicalBinding: property.includes('const binding = ResourceFieldSemanticBinding.fromExpression') && property.includes('return { binding, boundAst }'),
  noDescriptorVariableInResourceBinder: !all.includes('const descriptor =') && !all.includes('return { descriptor, boundAst }'),
  noForbiddenHostControlFlowInTouchedFiles: !/\b(if|while|for|switch)\b|\.(map|filter|reduce|flatMap)\(|\?\?|\bundefined\b|===|\bas\s+(unknown|any)\b/.test(all),
  noParsedDescriptorNames: !/Parsed[^\n]*(Descriptor|Property|Resource)/.test(all),
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}=${v}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
