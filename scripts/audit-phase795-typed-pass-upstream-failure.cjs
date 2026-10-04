const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const adapter = read('packages/core/src/compiler/passes/TypedPassAdapter.ts');
const model = read('packages/core/src/types/upstream/compilerPassFailure.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = {
  adapterImportsUpstreamFailure: adapter.includes("../../types/upstream/compilerPassFailure"),
  adapterUsesFailureModel: adapter.includes('compilerPassFailureOf(error)') && adapter.includes('compilerPassFailureMessage(failure)'),
  adapterNoFreeThrownStringification: !adapter.includes('String(error)'),
  upstreamClosedFailureAdt: model.includes("kind: 'compiler_pass_error'") && model.includes("kind: 'compiler_pass_non_error'"),
  upstreamUsesValueObjects: model.includes('ExceptionName') && model.includes('StringValue'),
  upstreamUsesRelationFold: model.includes('relationVariantFold'),
  exceptionNameFactory: names.includes('createExceptionName'),
  upstreamExported: index.includes("export * from './compilerPassFailure';"),
  noParsedPassDescriptor: !model.includes('Parsed') && !adapter.includes('Parsed'),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 795, checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
