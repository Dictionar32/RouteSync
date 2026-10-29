const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const checks = [
  ['resolver imports the upstream projection interface', resolver.includes("import type { ControllerResourceReturnSourceEvidenceProjectionInterface } from '../../../../types/upstream/controllerResourceReturnSourceEvidenceProjectionInterface';")],
  ['resolver context requires the projection contract', resolver.includes('readonly resourceReturnSourceEvidenceProjection: ControllerResourceReturnSourceEvidenceProjectionInterface<PhpAstValue, SourceRange>;')],
  ['resolver consumes the injected projection', resolver.includes('context.resourceReturnSourceEvidenceProjection.project({')],
  ['resolver does not import the concrete AST adapter', !resolver.includes("from '../../lexer/routeAst/controllerResourceReturnSourceEvidenceProjection'")],
  ['production wiring imports the existing AST adapter', wiring.includes("import { controllerResourceReturnSourceEvidenceProjection } from '../lexer/routeAst/controllerResourceReturnSourceEvidenceProjection';")],
  ['production wiring injects the adapter into action derivation', wiring.includes('resourceReturnSourceEvidenceProjection: controllerResourceReturnSourceEvidenceProjection,')],
];
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
