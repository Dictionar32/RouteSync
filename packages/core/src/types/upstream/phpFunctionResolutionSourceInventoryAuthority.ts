import type {
  PhpFunctionResolutionSourceInventory,
  PhpFunctionResolutionSourceInventoryAuthorityInterface,
  PhpFunctionResolutionSourceInventoryInput,
  PhpFunctionResolutionSourceInventoryObligation,
  PhpNamespaceRegionIdentity,
  PhpNamespaceRegionInventory,
} from './phpFunctionNameResolutionInterface';
import { PHP_FUNCTION_RESOLUTION_SOURCE_INVENTORY_CONTRACT } from './phpFunctionNameResolutionInterface';
import type { SourceFile } from './names';
import { sourceSpanOperations, type SourceSpan } from './provenance';

const sameFile = (left: SourceFile, right: SourceFile): boolean => left.value.value === right.value.value;
const sameSpan = (left: SourceSpan, right: SourceSpan): boolean =>
  sourceSpanOperations.same(left, right).kind === 'same_source_span';
const validSpan = (span: SourceSpan): boolean =>
  sourceSpanOperations.validateNonEmpty(span).kind === 'source_span_ordered';
const spanWithin = (span: SourceSpan, outer: SourceSpan): boolean =>
  sourceSpanOperations.contains(outer, span).kind === 'source_span_contained';
const sameRegion = (left: PhpNamespaceRegionIdentity, right: PhpNamespaceRegionIdentity): boolean => {
  if (left.kind !== right.kind || !sameFile(left.sourceFile, right.sourceFile) || !sameSpan(left.source, right.source)) return false;
  if (left.kind === 'global_php_namespace_region' && right.kind === 'global_php_namespace_region') return true;
  if (left.kind === 'named_php_namespace_region' && right.kind === 'named_php_namespace_region') {
    return left.namespace.value.value.toLocaleLowerCase('en-US') === right.namespace.value.value.toLocaleLowerCase('en-US');
  }
  return false;
};

const regionInventoryIsBound = (inventory: PhpNamespaceRegionInventory, sourceFile: SourceFile, source: SourceSpan): boolean => {
  const { region, namespaceImports, functionImports, declarations, completeness } = inventory;
  const items = [
    ...namespaceImports.items.map(binding => ({ source: binding.source, region: binding.region, obligation: 'namespace-prefix-import-declarations' as const })),
    ...functionImports.items.map(binding => ({ source: binding.source, region: binding.region, obligation: 'function-import-declarations' as const })),
    ...declarations.items.map(declaration => ({ source: declaration.source, region: declaration.region, obligation: 'named-function-declarations' as const })),
  ];
  return sameFile(region.sourceFile, sourceFile)
    && sameFile(region.source.file, sourceFile)
    && spanWithin(region.source, source)
    && sameFile(completeness.sourceFile, sourceFile)
    && sameSpan(completeness.source, region.source)
    && sameRegion(completeness.region, region)
    && completeness.obligations.length === 4
    && completeness.obligations[0] === 'namespace-region-inventoried'
    && completeness.obligations[1] === 'namespace-prefix-imports-inventoried'
    && completeness.obligations[2] === 'function-imports-inventoried'
    && completeness.obligations[3] === 'function-declarations-inventoried'
    && items.every(item => sameRegion(item.region, region) && spanWithin(item.source, region.source));
};

const duplicateOrOverlappingRegions = (regions: readonly PhpNamespaceRegionInventory[]): boolean => regions.some((left, index) =>
  regions.slice(index + 1).some(right =>
    sameRegion(left.region, right.region)
    || sourceSpanOperations.overlaps(left.region.source, right.region.source).kind === 'source_span_overlapping',
  ),
);

const missingObligations = (input: PhpFunctionResolutionSourceInventoryInput): readonly PhpFunctionResolutionSourceInventoryObligation[] => {
  const missing = new Set<PhpFunctionResolutionSourceInventoryObligation>();
  const coverage = input.coverage;
  if (coverage.kind !== 'php_function_resolution_source_inventory_coverage_complete'
    || !sameFile(coverage.sourceFile, input.sourceFile)
    || !sameSpan(coverage.source, input.source)
    || coverage.obligations.length !== 4
    || coverage.obligations[0] !== 'all-namespace-region-declarations-visited'
    || coverage.obligations[1] !== 'all-import-declarations-visited-per-region'
    || coverage.obligations[2] !== 'all-named-function-declarations-visited-per-region'
    || coverage.obligations[3] !== 'all-region-boundaries-accounted-for') {
    if (coverage.kind === 'php_function_resolution_source_inventory_coverage_incomplete') {
      coverage.missingEvidence.forEach(obligation => missing.add(obligation));
    }
    missing.add('namespace-region-declarations');
    missing.add('namespace-prefix-import-declarations');
    missing.add('function-import-declarations');
    missing.add('named-function-declarations');
    missing.add('region-source-boundaries');
  }
  if (!validSpan(input.source) || !sameFile(input.source.file, input.sourceFile)) missing.add('region-source-boundaries');
  if (input.regions.length === 0) missing.add('namespace-region-declarations');
  if (input.regions.some(region => !regionInventoryIsBound(region, input.sourceFile, input.source))) {
    missing.add('region-source-boundaries');
    missing.add('namespace-region-declarations');
    missing.add('namespace-prefix-import-declarations');
    missing.add('function-import-declarations');
    missing.add('named-function-declarations');
  }
  if (duplicateOrOverlappingRegions(input.regions)) missing.add('region-source-boundaries');
  return Object.freeze([...missing]);
};

const inspect = (input: PhpFunctionResolutionSourceInventoryInput): PhpFunctionResolutionSourceInventory => {
  const missingEvidence = missingObligations(input);
  if (missingEvidence.length > 0) {
    return Object.freeze({
      kind: 'php_function_resolution_source_inventory_incomplete',
      sourceFile: input.sourceFile,
      source: input.source,
      missingEvidence,
    });
  }
  return Object.freeze({
    kind: 'php_function_resolution_source_inventory_complete',
    sourceFile: input.sourceFile,
    source: input.source,
    regions: input.regions,
    obligations: Object.freeze([
      'all-namespace-regions-inventoried',
      'all-namespace-prefix-imports-inventoried-per-region',
      'all-function-imports-inventoried-per-region',
      'all-function-declarations-inventoried-per-region',
    ]),
  });
};

export const phpFunctionResolutionSourceInventoryAuthority: PhpFunctionResolutionSourceInventoryAuthorityInterface = Object.freeze({
  kind: 'php_function_resolution_source_inventory_authority',
  contract: PHP_FUNCTION_RESOLUTION_SOURCE_INVENTORY_CONTRACT,
  inspect,
});
