#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const kernelIndex = read('packages/core/src/semantic/kernel/index.ts');
const contextBuilder = read('packages/core/src/semantic/kernel/contextBuilder.ts');
const semanticResolution = read('packages/core/src/types/domain/semanticResolution.ts');
const field = read('packages/core/src/types/field.ts');
const resourceGroups = read('packages/core/src/types/domain/resourceGroupDescriptors.ts');

const exportedNames = [...kernelIndex.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*['\"]\.\/([^'\"]+)['\"]/g)]
  .flatMap(match => match[1].split(',').map(value => value.trim().replace(/\s+as\s+\w+$/, '')).filter(Boolean).map(name => ({ name, module: match[2] })));

const kernelExportProblems = exportedNames
  .filter(({ name, module }) => {
    const source = module === 'contextBuilder' ? contextBuilder : null;
    return source !== null && !new RegExp(`(?:export\\s+(?:function|const|class|interface|type)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b)`).test(source);
  })
  .map(entry => `${entry.module}:${entry.name}`);

const staleKernelGuards = ['isFieldNodeRecord', 'isSemanticResolutionRecord'].filter(name =>
  kernelIndex.includes(name) || contextBuilder.includes(name)
);

const descriptorLegacySurface = ['ScannedResourceGroupTypeSignature', 'ScannedFullCrudResourceGroupDescriptor', 'ScannedReadOnlyCrudResourceGroupDescriptor', 'ScannedFlexibleCrudResourceGroupDescriptor', 'ScannedSingletonResourceGroupDescriptor', 'ScannedCustomResourceGroupDescriptor', 'ScannedCrudResourceGroupDescriptor']
  .filter(name => resourceGroups.includes(name));

const semanticAdt = {
  fieldNode: /export\s+type\s+FieldNode\s*=/.test(field),
  fieldCatamorphism: /matchFieldNode/.test(field),
  semanticResolution: /export\s+type\s+SemanticResolution\s*=/.test(semanticResolution),
  semanticResolutionMatcher: /matchSemanticResolution/.test(semanticResolution),
};

const result = {
  phase: 696,
  diagnosticFrontier: {
    staleKernelGuards,
    kernelExportProblems,
    resolvedDtsBlocker: staleKernelGuards.length === 0 && kernelExportProblems.length === 0,
  },
  canonicalSemanticAdt: semanticAdt,
  legacyDescriptorSurface: {
    namesStillDeclared: descriptorLegacySurface,
    migrationRequired: descriptorLegacySurface.length > 0,
  },
  status: staleKernelGuards.length === 0 && kernelExportProblems.length === 0 ? 'PASS' : 'FAIL',
};
console.log(JSON.stringify(result, null, 2));
