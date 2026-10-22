const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['composition ADT preserves exact upstream rejected inventory', /controller_invocation_manifest_inventory_rejected/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts')) && /inventory:\s*Extract<[\s\S]*laravel_controller_invocation_semantic_judgment_inventory_rejected/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts'))],
  ['composition consumes existing upstream inventory ADT directly', /switch \(inventoryResult\.kind\)/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts')) && !/terminalOutcomeFrom|ControllerInvocationManifestCompositionRejectedError/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['composition does not throw for rejected inventory', !/throw new ControllerInvocationManifestCompositionRejectedError|Unhandled controller invocation inventory result/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['scan handles inventory rejection at CLI presentation boundary', /controller_invocation_manifest_inventory_rejected/.test(read('packages/cli/src/commands/scan.ts'))],
  ['sync handles inventory rejection at CLI presentation boundary', /controller_invocation_manifest_inventory_rejected/.test(read('packages/cli/src/commands/sync.ts'))],
  ['drift audit handles inventory rejection at CLI presentation boundary', /controller_invocation_manifest_inventory_rejected/.test(read('packages/cli/src/commands/audit/driftAuditor.ts'))],
  ['drift audit removes any[] route assertion', !/as any\[\]/.test(read('packages/cli/src/commands/audit/driftAuditor.ts'))],
  ['manifest-builder blocked judgment remains handled', ['packages/cli/src/commands/scan.ts','packages/cli/src/commands/sync.ts','packages/cli/src/commands/audit/driftAuditor.ts'].every(file => /manifest_builder_blocked/.test(read(file)))],
  ['no forbidden semantic foundation or relations import added in touched path', !/(semantic\/foundation|semantic\/relations)/.test(['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts','packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts','packages/cli/src/commands/scan.ts','packages/cli/src/commands/sync.ts','packages/cli/src/commands/audit/driftAuditor.ts'].map(read).join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
