const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const allTs = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) walk(p);
  else if (e.name.endsWith('.ts')) allTs.push(p);
});
walk(core);
const joined = allTs.map(p => fs.readFileSync(p, 'utf8')).join('\n');
const legacyDescriptorRefs = (joined.match(/ResourceFieldDescriptor/g) || []).length;
const legacyKindRefs = (joined.match(/ResourceFieldKind/g) || []).length;
const canonicalBinding = read('packages/core/src/types/domain/resourceFieldSemanticBinding.ts');
const compilerShim = read('packages/core/src/compiler/scanner/semantic/resourceFieldSemanticBinding.ts');
const execution = read('packages/core/src/types/domain/executionSignatures.ts');
const checks = {
  canonicalBindingInDomain: canonicalBinding.includes('export interface ResourceFieldSemanticBinding'),
  canonicalBindingOwnsSemanticWitness: canonicalBinding.includes('readonly semantic: ResourceFieldSemantic'),
  canonicalBindingOwnsBoundAst: canonicalBinding.includes('readonly boundAst: BoundSemanticNode'),
  legacyDescriptorRefsZero: legacyDescriptorRefs === 0,
  legacyResourceFieldKindRefsZero: legacyKindRefs === 0,
  compilerLegacyShimEmpty: compilerShim.length === 0,
  executionUsesSemanticStringValue: execution.includes('SemanticValueFactory.stringValue(`payload: ${typeName}`)'),
  executionUsesSemanticCallArgumentValue: execution.includes("SemanticValueFactory.stringValue('payload')"),
  executionNoForbiddenConstructs: !(/\b(if|for|while|switch|map|filter|reduce|flatMap|undefined|null|new|any)\b|\?\?|===|as unknown/.test(execution)),
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({ phase: 725, checks, failed, pass: failed.length === 0 }, null, 2));
process.exitCode = failed.length ? 1 : 0;
