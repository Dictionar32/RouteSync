const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const generate = path.join(root, 'packages', 'cli', 'src', 'commands', 'generate.ts');
const source = fs.readFileSync(generate, 'utf8');

const forbidden = [
  'normalizeManifest(',
  'SemanticResolutionKernel',
  'ModelGraphBuilderPass',
  'SemanticResolutionPass',
  'NormalizationPass',
];

const result = {
  phase: 836,
  objective: 'remove the unused legacy semantic normalization pipeline from the production generate command',
  generateCommand: path.relative(root, generate),
  forbiddenProductionCalls: forbidden.filter(token => source.includes(token)),
  compilerBridgeEmission: source.includes('CompilerBridge.emitFullBundle'),
  unknownCatchBoundary: source.includes('catch (err: unknown)'),
  testOnlyNormalizerConsumers: [
    'packages/sdk/tests/orders.spec.ts',
    'packages/sdk/tests/normalizer.spec.ts',
    'packages/sdk/tests/generatorTypeSafety.spec.ts',
  ],
};

result.productionGenerateIsolationClosed =
  result.forbiddenProductionCalls.length === 0 &&
  result.compilerBridgeEmission &&
  result.unknownCatchBoundary;

console.log(JSON.stringify(result, null, 2));
process.exit(result.productionGenerateIsolationClosed ? 0 : 1);
