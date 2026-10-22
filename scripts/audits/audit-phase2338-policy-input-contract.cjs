const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const resolverPath = path.join(root, 'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const failures = [];
const checks = [];
const check = (condition, message) => {
  checks.push(message);
  if (!condition) failures.push(message);
};

const input = contract.split('export interface EffectiveControllerActionPolicyUpstreamInput {')[1]?.split('\n}')[0] ?? '';
check(input.includes('readonly policy: readonly ControllerPolicyRelation[];'), 'policy evidence is required by the existing upstream input contract');
check(input.includes('readonly inheritedFrom: readonly ControllerName[];'), 'inheritance lineage is required by the existing upstream input contract');
check(input.includes('readonly source: readonly SourceSpan[];'), 'source provenance is required by the existing upstream input contract');
check(!/readonly (policy|inheritedFrom|source)\?\s*:/.test(input), 'no optional semantic evidence fields remain');
check(!resolver.includes('input.policy ??'), 'resolver does not invent empty policy evidence');
check(!resolver.includes('input.inheritedFrom ??'), 'resolver does not invent empty inheritance lineage');
check(!resolver.includes('input.source ??'), 'resolver does not invent empty provenance');
check(resolver.includes('effectiveControllerActionPolicyAlgebra.controllerMiddleware(input.policy)'), 'resolver forwards the required policy contract to the existing algebra');

const sourceRoot = path.join(root, 'packages/core/src');
const files = [];
const visit = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(full);
  }
};
visit(sourceRoot);
let callCount = 0;
let completeCallCount = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const marker = 'resolveEffectiveControllerActionPolicyUpstream({';
  let offset = 0;
  while ((offset = source.indexOf(marker, offset)) >= 0) {
    callCount += 1;
    const start = offset + marker.length - 1;
    let depth = 0;
    let end = start;
    for (; end < source.length; end += 1) {
      if (source[end] === '{') depth += 1;
      if (source[end] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const body = source.slice(start, end + 1);
    const required = ['policy:', 'inheritedFrom:', 'source:'];
    const complete = required.every(field => body.includes(field));
    if (complete) completeCallCount += 1;
    else failures.push(`incomplete upstream policy input at ${path.relative(root, file)}:${source.slice(0, offset).split('\n').length}`);
    offset = end + 1;
  }
}
check(callCount > 0 && completeCallCount === callCount, `all ${callCount} existing resolver call sites provide policy, inheritance, and provenance explicitly`);

console.log(`Phase 2338 existing policy input contract: ${checks.length}/${checks.length - failures.length} checks passed`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exitCode = 1;
} else {
  for (const message of checks) console.log(`PASS: ${message}`);
}
