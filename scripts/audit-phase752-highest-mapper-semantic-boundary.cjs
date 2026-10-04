const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = [
  'packages/core/src/compiler/passes/mapper/readMapperBuilder.ts',
  'packages/core/src/compiler/passes/mapper/readFieldLineBuilder.ts',
  'packages/core/src/utils/resource-naming.ts',
];

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = Object.fromEntries(files.map(file => [file, read(file)]));

// Generated target-language text is intentionally allowed to contain target constructs
// such as Array.map/optional chaining. Audit only the host TypeScript expression layer.
const hostSource = value => value.replace(/`(?:\\.|[^`])*`/gs, '');

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

expect(!source[files[0]].includes('relationIndexEntries'), 'build frontier relationIndexEntries leaked into mapper builder');
expect(source[files[0]].includes('toPascalResourceName(graph.resourceName)'), 'resource naming is not typed at mapper boundary');
expect(source[files[0]].includes('relationProject('), 'mapper field traversal is not relation-driven');
expect(!hostSource(source[files[0]]).match(/\.map\(/), 'mapper builder still uses host map traversal');
expect(!hostSource(source[files[0]]).includes('??'), 'mapper builder still uses nullish coalescing');
expect(source[files[1]].includes('PropertyName'), 'field mapper does not consume canonical PropertyName');
expect(source[files[1]].includes('relationSelect('), 'field selection is not relation-driven');
expect(source[files[1]].includes('relationProject('), 'field projection is not relation-driven');
expect(!hostSource(source[files[1]]).match(/\.map\(/), 'field mapper source still uses host map traversal');
expect(!hostSource(source[files[1]]).match(/\.filter\(/), 'field mapper source still uses host filter traversal');
expect(!hostSource(source[files[1]]).match(/\bas\s+[A-Za-z_]/), 'field mapper contains a type cast');
expect(source[files[2]].includes('toPascalResourceName'), 'canonical ResourceName naming projection missing');
expect(source[files[2]].includes('toCamelPropertyName'), 'canonical PropertyName naming projection missing');

const all = Object.values(source).join('\n');
expect(!all.includes('resolveResourceBaseName'), 'unused resource base-name descriptor remains');
expect(!all.includes('ParsedField'), 'legacy parsed field descriptor leaked into mapper boundary');

const report = {
  phase: 752,
  model: 'highest-mapper-semantic-boundary',
  checks: {
    buildFrontierRemoved: !source[files[0]].includes('relationIndexEntries'),
    canonicalResourceNameBoundary: source[files[0]].includes('toPascalResourceName(graph.resourceName)'),
    canonicalPropertyNameBoundary: source[files[1]].includes('PropertyName'),
    relationDrivenTraversal: source[files[0]].includes('relationProject(') && source[files[1]].includes('relationProject('),
    relationDrivenSelection: source[files[1]].includes('relationSelect('),
    noHostMapFilterInChangedMapperSource: !hostSource(source[files[0]]).match(/\.map\(/) && !hostSource(source[files[1]]).match(/\.map\(/) && !hostSource(source[files[1]]).match(/\.filter\(/),
    noLegacyParsedFieldBoundary: !all.includes('ParsedField'),
    noUnusedResourceBaseNameDescriptor: !all.includes('resolveResourceBaseName'),
  },
  failed: failures,
  pass: failures.length === 0,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = failures.length === 0 ? 0 : 1;
