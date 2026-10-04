const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const binding = read('packages/core/src/types/domain/routes.ts');
const resolution = read('packages/core/src/compiler/scanner/resolvers/boundary/bindingResolution.ts');
const input = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/bindingBuilder.ts');
const factory = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts');
const legacy = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];

const checks = {
  routeOperationHasController: /interface RouteOperationBinding\s*{[\s\S]*readonly controllerName: ControllerName;/.test(binding),
  routeOperationHasAction: /interface RouteOperationBinding\s*{[\s\S]*readonly name: ActionName;/.test(binding),
  routeOperationHasHandler: /interface RouteOperationBinding\s*{[\s\S]*readonly handler: RouteHandlerDescriptor;/.test(binding),
  resolverProducesOperation: /operation:\s*Object\.freeze\({[\s\S]*controllerName: params\.controllerName,[\s\S]*name: params\.action,[\s\S]*handler: params\.handler/.test(resolution),
  resolvedBoundaryOwnsBinding: /readonly binding: ResolvedRouteBinding;/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts')),
  inputResolvesBindingOnce: /const binding = resolveRouteBinding\(/.test(input) && !/resolveRouteBinding\(resolved\)/.test(factory),
  builderConsumesOperation: /operation:\s*resolved\.operation/.test(builder),
  factoryConsumesCanonicalBinding: /buildRouteBindingContract\(resolved, basics, resolved\.binding\)/.test(factory),
  noFlatBindingConstruction: !/\n\s*(handler|action|actionName|controllerName):/.test(builder),
  noProductionFlatBindingConsumer: (() => {
    const dirs = [path.join(root, 'packages/core/src'), path.join(root, 'packages/cli/src')];
    const bad = [];
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, entry.name);
        if (entry.isDirectory()) walk(f);
        else if (entry.name.endsWith('.ts')) {
          const s = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(?:\"(?:\\.|[^\"])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, '');
          if (/binding\.(handler|actionName|controllerName|action\.)/.test(s)) bad.push(f);
        }
      }
    };
    dirs.forEach(walk);
    return bad.length === 0;
  })(),
  parsedDescriptorReservoirsEmpty: legacy.every((p) => fs.statSync(path.join(root, p)).size === 0),
};

for (const [name, value] of Object.entries(checks)) console.log(`${name}=${value}`);
const failed = Object.entries(checks).filter(([, v]) => !v);
if (failed.length) process.exitCode = 1;
