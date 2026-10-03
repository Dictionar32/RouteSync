const fs = require('fs');
const path = require('path');

const root = process.cwd();
const binding = 'packages/core/src/compiler/scanner/semantic/resourceFieldSemanticBinding.ts';
const source = fs.readFileSync(path.join(root, binding), 'utf8');
const imports = [...source.matchAll(/from ['"](\.\.?[^'"]+)['"]/g)].map(match => match[1]);
const unresolved = imports.filter(specifier => {
  const base = path.resolve(path.dirname(path.join(root, binding)), specifier);
  return !['.ts', '.tsx', '.js', '.d.ts'].some(ext => fs.existsSync(base + ext)) &&
    !fs.existsSync(path.join(base, 'index.ts')) &&
    !fs.existsSync(path.join(base, 'index.tsx'));
});

const hasSemanticWitness = /readonly semantic:\s*ResourceFieldSemantic/.test(source);
const hasBoundAst = /readonly boundAst:\s*BoundSemanticNode/.test(source);
const hasSemanticType = /readonly semanticType:\s*SemanticType/.test(source);
const legacyDescriptorRefs = [];
for (const dir of ['packages/core/src/compiler', 'packages/core/src/types']) {
  const walk = current => {
    for (const entry of fs.readdirSync(path.join(root, current), { withFileTypes: true })) {
      const rel = path.join(current, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.ts') && !rel.includes('/descriptors/resource/')) {
        const text = fs.readFileSync(path.join(root, rel), 'utf8');
        if (text.includes('ResourceFieldDescriptor')) legacyDescriptorRefs.push(rel);
      }
    }
  };
  walk(dir);
}

const result = {
  phase: 722,
  checks: {
    canonicalBindingImportsResolve: unresolved.length === 0,
    bindingOwnsSemanticWitness: hasSemanticWitness,
    bindingOwnsSemanticType: hasSemanticType,
    bindingOwnsBoundAst: hasBoundAst,
    upstreamResourceAstExists: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/ast.ts')),
    upstreamResourceDefinitionExists: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/resource.ts')),
    laravelResourceFixtureExists: fs.existsSync(path.join(root, 'examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php')),
    legacyDescriptorRefsRemainAsNextFrontier: legacyDescriptorRefs.length > 0,
  },
  unresolved,
  legacyDescriptorRefCount: legacyDescriptorRefs.length,
  legacyDescriptorRefs: legacyDescriptorRefs.slice(0, 50),
};
result.pass = Object.entries(result.checks)
  .filter(([key]) => key !== 'legacyDescriptorRefsRemainAsNextFrontier')
  .every(([, value]) => value === true);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
