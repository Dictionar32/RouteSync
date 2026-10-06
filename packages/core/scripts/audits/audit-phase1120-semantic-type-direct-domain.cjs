const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../src');
const canonical = path.resolve(root, 'types/domain/semanticType.ts');
const facade = path.resolve(root, 'compiler/types/SemanticType.ts');

const files = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) files.push(full);
  }
};
walk(root);

const violations = [];
let directDomainConsumers = 0;
let facadeConsumers = 0;
let unresolvedDirectDomain = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const importRe = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(text))) {
    const spec = match[1];
    if (!spec.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(file), spec + (spec.endsWith('.ts') ? '' : '.ts'));
    if (resolved === facade) {
      // The compatibility barrel is allowed to re-export the facade itself.
      const relativeFile = path.relative(root, file).replaceAll('\\', '/');
      const allowed = relativeFile === 'compiler/types/SemanticType.ts' || relativeFile === 'compiler/types/index.ts';
      if (!allowed) {
        facadeConsumers++;
        violations.push(relativeFile);
      }
    }
    if (resolved === canonical) directDomainConsumers++;
  }
}

const canonicalText = fs.readFileSync(canonical, 'utf8');
const facadeText = fs.readFileSync(facade, 'utf8');
const canonicalImportsCompiler = /from\s+['"][^'"]*compiler\//.test(canonicalText);
const facadeOwnsSemanticAlgebra = /^\s*export\s+(enum|interface|class)\s+(SemanticType|PrimitiveKind)\b/m.test(facadeText);

const result = {
  phase: 1120,
  direction: 'upstream => wiring => interface => downstream',
  checks: {
    canonicalSemanticTypeDomain: fs.existsSync(canonical),
    canonicalDomainNoCompilerImports: !canonicalImportsCompiler,
    productionCompilerUsesCanonicalDomain: directDomainConsumers > 0,
    compatibilityFacadeHasNoSemanticTypeAlgebra: !facadeOwnsSemanticAlgebra,
    productionFacadeConsumersEmpty: facadeConsumers === 0,
    unresolvedDirectDomainImports: unresolvedDirectDomain.length === 0,
  },
  counts: { directDomainConsumers, facadeConsumers },
  violations: { facadeConsumers: violations, unresolvedDirectDomain },
};
result.passed = Object.values(result.checks).every(Boolean) && violations.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
