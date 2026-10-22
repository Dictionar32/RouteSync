const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [
  {
    name: 'name-resolution authority interface exists',
    pass: read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts').includes('interface PhpFunctionNameResolutionAuthorityInterface'),
  },
  {
    name: 'production name-resolution authority implementation is still missing (known gap)',
    pass: !fs.readdirSync(path.join(root, 'packages/core/src/types/upstream')).some((name) => /phpFunctionNameResolutionAuthority\.(ts|tsx)$/.test(name)),
  },
  {
    name: 'call interface still accepts raw FunctionName (known gap)',
    pass: read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthorityInterface.ts').includes('readonly function: FunctionName;'),
  },
  {
    name: 'call authority still imports semantic/relations (known gap)',
    pass: read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts').includes("../../semantic/relations/"),
  },
  {
    name: 'Laravel scanner currently ignores functionNameEvidence (known gap)',
    pass: read('packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts').includes('function: functionName(name),')
      && !read('packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts').includes('functionNameEvidence'),
  },
  {
    name: 'generic integrated response is currently based on SemanticKnowledgeDataFlow',
    pass: read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts').includes('readonly knowledge: SemanticKnowledgeDataFlow;'),
  },
  {
    name: 'trace report exists',
    pass: exists('PHASE1779_PHP_INVOCATION_INTERFACE_FIRST_TRACE.md'),
  },
];
for (const check of checks) {
  process.stdout.write(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}\n`);
}
const failed = checks.filter((check) => !check.pass);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} trace assertions passed.\n`);
if (failed.length > 0) process.exitCode = 1;
