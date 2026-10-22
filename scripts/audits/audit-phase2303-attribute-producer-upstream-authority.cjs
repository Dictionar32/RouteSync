const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  {
    name: 'attribute producer contract v3 injects the existing upstream expression authority',
    pass: /contractVersion:\s*3/.test(read('packages/core/src/compiler/scanner/attributeProducerInterface.ts'))
      && /PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>/.test(read('packages/core/src/compiler/scanner/attributeProducerInterface.ts')),
  },
  {
    name: 'producer delegates closure evidence through the injected authority',
    pass: /input\.expressionAuthority\.derive\(/.test(read('packages/core/src/compiler/scanner/attributeProducer.ts'))
      && /kind:\s*'php_ast_expression_evidence'/.test(read('packages/core/src/compiler/scanner/attributeProducer.ts')),
  },
  {
    name: 'attribute producer does not directly call closure lowering or the old subscanner producer',
    pass: !/resolveClosureBody|expressionFromPhpAst/.test(read('packages/core/src/compiler/scanner/attributeProducer.ts')),
  },
  {
    name: 'Laravel attribute scanner wires the existing PHP expression authority',
    pass: /import \{ phpAstExpressionSemanticAuthority \} from '\.\/lexer\/routeAst\/phpAstExpressionSemanticAuthority'/.test(read('packages/core/src/compiler/scanner/laravelAttributeScanner.ts'))
      && /expressionAuthority:\s*phpAstExpressionSemanticAuthority/.test(read('packages/core/src/compiler/scanner/laravelAttributeScanner.ts')),
  },
  {
    name: 'Laravel attribute scanner public contract remains version 18',
    pass: /contractVersion:\s*18/.test(read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts')),
  },
];

for (const check of checks) {
  process.stdout.write(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}\n`);
}
if (checks.some((check) => !check.pass)) process.exitCode = 1;
