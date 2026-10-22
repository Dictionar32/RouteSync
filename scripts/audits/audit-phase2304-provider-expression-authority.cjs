const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const providerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts');
const producerPath = path.join(root, 'packages/core/src/compiler/scanner/attributeProducer.ts');
const authorityPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSemanticAuthority.ts');
const provider = fs.readFileSync(providerPath, 'utf8');
const producer = fs.readFileSync(producerPath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');

const checks = [
  ['provider imports existing upstream expression authority', provider.includes("phpAstExpressionSemanticAuthority, projectPhpAstExpressionToUpstream")],
  ['provider method body is derived through authority', provider.includes('body: phpAstExpressionSemanticAuthority.derive({')],
  ['provider no longer imports or calls resolveClosureBody', !provider.includes('resolveClosureBody')],
  ['attribute producer continues using the existing authority contract', producer.includes('input.expressionAuthority.derive(')],
  ['existing authority owns closure body projection', authority.includes('body: resolveClosureBody(node.body.statements, file, resolveChild)')],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
