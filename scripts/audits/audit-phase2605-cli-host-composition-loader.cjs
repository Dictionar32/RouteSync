const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const loaderPath = path.join(root, 'packages/cli/src/standaloneCompositionLoader.ts');
const entryPath = path.join(root, 'packages/cli/src/index.ts');
const loader = fs.readFileSync(loaderPath, 'utf8');
const entry = fs.readFileSync(entryPath, 'utf8');
const assertions = [
  ['host module path is explicit', loader.includes("'ROUTESYNC_UPSTREAM_COMPOSITION_MODULE'")],
  ['host export name is explicit', loader.includes("'requestTypeDerivationSemanticComposition'")],
  ['loader imports a host module rather than constructing semantics', loader.includes('await import(moduleUrl)') && !loader.includes('createRequestTypeDerivationAuthority(')],
  ['canonical upstream contract identity is required', loader.includes('contract !== requestTypeDerivationContract')],
  ['all semantic capabilities are checked against one contract object', loader.includes("isCapability(member(value, 'reasoning'), contract, 'infer')") && loader.includes("isCapability(member(value, 'verifier'), contract, 'verify')") && loader.includes("isCapability(member(value, 'decision'), contract, 'decide')")],
  ['authority and integrity capabilities are checked', loader.includes("isCapability(authority, contract, 'evaluate')") && loader.includes("isCapability(integrity, contract, 'validate')")],
  ['standalone CLI loads host composition', entry.includes('loadRouteSyncStandaloneComposition(process.env[ROUTESYNC_UPSTREAM_COMPOSITION_MODULE])')],
  ['program only dispatches after canonical composition assembly', entry.includes('createProgramFromSemanticComposition(loaded.composition)') && entry.includes('programResolution.program.parseAsync(process.argv)')],
  ['missing or invalid composition fails closed', entry.includes('composition_module_missing') && entry.includes('composition_module_invalid') && entry.includes('process.exitCode = 1')],
  ['legacy solver is not imported or invoked by the loader', !loader.includes('requestTypeDerivationSolver') && !loader.includes('legacyRequestTypeSolver')],
];

let failed = 0;
for (const [name, passed] of assertions) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\nPhase 2605 CLI host-composition loader: ${assertions.length - failed}/${assertions.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
