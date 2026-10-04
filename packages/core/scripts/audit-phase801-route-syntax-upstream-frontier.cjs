const fs=require('fs');
const p='packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts';
const s=fs.readFileSync(p,'utf8');
const checks={
 relationFirstOrCanonical:s.includes("from '../../../../semantic/kernel/relationalSequence';"),
 tokenDescriptorImported:s.includes("import type { TokenDescriptor } from '../phpAstTypes';"),
 routeMethodPresenceAdapter:s.includes('relationOptionFold(tokenRouteMethod(token)'),
 constraintMethodPresenceAdapter:s.includes('relationOptionFold(tokenRouteConstraintMethod(token)'),
 stringConstraintPresenceFold:s.includes('presenceFold(stringValue(cursor)'),
 groupSelectionPresencePredicate:s.includes("relationFirst([propertyReader, bindingReader, present<'constraints'>('constraints')], isPresent)"),
 noOldFirstOrImport:!s.includes("relationFirstOr } from '../../../relational/sequence'")
};
console.log(JSON.stringify({checks,allPass:Object.values(checks).every(Boolean)},null,2));
