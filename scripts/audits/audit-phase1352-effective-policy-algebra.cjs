const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const passed = [];
const has = (file, pattern, label) => pattern.test(read(file)) ? passed.push(label) : failures.push(`${file}: missing ${label}`);
const lacks = (file, pattern, label) => pattern.test(read(file)) ? failures.push(`${file}: forbidden ${label}`) : passed.push(label);
const contract = 'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts';
const algebra = 'packages/core/src/types/upstream/effectiveControllerActionPolicyAlgebra.ts';
const resolver = 'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts';
has(contract, /EffectiveControllerActionPolicyAlgebraInterface/, 'effective policy algebra has a shared contract');
has(contract, /EffectiveControllerActionPolicyUpstreamInput/, 'effective policy input contract is type-owned');
has(algebra, /effectiveControllerActionPolicyAlgebra:\s*EffectiveControllerActionPolicyAlgebraInterface/, 'one canonical policy algebra implements the contract');
for (const method of ['controllerMiddleware', 'effectiveMiddleware', 'authorization']) {
  has(algebra, new RegExp(`\\b${method}\\b`), `algebra owns ${method} reasoning`);
}
has(resolver, /effectiveControllerActionPolicyAlgebra\.controllerMiddleware/, 'resolver delegates controller policy normalization');
has(resolver, /effectiveControllerActionPolicyAlgebra\.effectiveMiddleware/, 'resolver delegates middleware scope/exclusion reasoning');
has(resolver, /effectiveControllerActionPolicyAlgebra\.authorization/, 'resolver delegates authorization applicability reasoning');
lacks(resolver, /\.filter\(|\.some\(|scopeApplies|sameMiddleware|relation\.kind\s*!==/, 'resolver does not reimplement policy classification');
has('packages/core/src/types/upstream/index.ts', /effectiveControllerActionPolicyAlgebra/, 'canonical policy algebra is exported from upstream boundary');
const result = { audit: 'phase1352-effective-policy-algebra', passed: failures.length === 0, passedChecks: passed.length, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
