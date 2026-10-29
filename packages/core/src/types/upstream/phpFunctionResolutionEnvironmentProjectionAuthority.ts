import type {
  PhpFunctionResolutionEnvironmentProjectionInput,
  PhpFunctionResolutionEnvironmentProjectionInterface,
  PhpFunctionResolutionEnvironmentProjectionResult,
  PhpFunctionResolutionEnvironmentProjectionFailure,
  PhpFunctionResolutionScope,
  PhpFunctionResolutionSourceInventory,
  PhpNamespaceRegionInventory,
} from './phpFunctionNameResolutionInterface';
import { PHP_FUNCTION_RESOLUTION_ENVIRONMENT_PROJECTION_CONTRACT } from './phpFunctionNameResolutionInterface';
import type { SourceFile } from './names';
import { sourceSpanOperations, type SourceSpan } from './provenance';

const sameFile = (left: SourceFile, right: SourceFile): boolean => left.value.value === right.value.value;
const validSpan = (span: SourceSpan): boolean =>
  sourceSpanOperations.validateNonEmpty(span).kind === 'source_span_ordered';
const spanWithin = (span: SourceSpan, outer: SourceSpan): boolean =>
  validSpan(span)
  && validSpan(outer)
  && sourceSpanOperations.contains(outer, span).kind === 'source_span_contained';

const scopeOf = (region: PhpNamespaceRegionInventory): PhpFunctionResolutionScope => {
  switch (region.region.kind) {
    case 'global_php_namespace_region':
      return Object.freeze({
        kind: 'global_function_scope',
        region: region.region,
        namespaceImports: region.namespaceImports,
        imports: region.functionImports,
        declarations: region.declarations,
      });
    case 'named_php_namespace_region':
      return Object.freeze({
        kind: 'namespaced_function_scope',
        region: region.region,
        namespaceImports: region.namespaceImports,
        imports: region.functionImports,
        declarations: region.declarations,
      });
  }
};

const incomplete = (
  input: PhpFunctionResolutionEnvironmentProjectionInput,
  reason: PhpFunctionResolutionEnvironmentProjectionFailure,
  inventory: PhpFunctionResolutionSourceInventory = input.inventory,
): PhpFunctionResolutionEnvironmentProjectionResult => Object.freeze({
  kind: 'php_function_resolution_environment_projection_incomplete',
  inventory,
  invocationSource: input.invocationSource,
  reason,
  judgment: Object.freeze({
    kind: 'function_resolution_environment_incomplete',
    environment: Object.freeze({
      kind: 'incomplete_function_resolution_environment',
      sourceFile: inventory.sourceFile,
      missingEvidence: Object.freeze(['namespace-region', 'namespace-prefix-imports', 'function-imports', 'function-declarations']),
      source: input.invocationSource,
    }),
  }),
});

const project = (input: PhpFunctionResolutionEnvironmentProjectionInput): PhpFunctionResolutionEnvironmentProjectionResult => {
  if (input.inventory.kind !== 'php_function_resolution_source_inventory_complete') {
    return incomplete(input, 'source-inventory-incomplete');
  }
  if (!sameFile(input.inventory.sourceFile, input.invocationSource.file)) {
    return incomplete(input, 'invocation-source-file-mismatch');
  }
  if (!validSpan(input.invocationSource) || !spanWithin(input.invocationSource, input.inventory.source)) {
    return incomplete(input, 'invocation-source-span-invalid');
  }

  const regions = input.inventory.regions.filter(region => spanWithin(input.invocationSource, region.region.source));
  if (regions.length === 0) return incomplete(input, 'no-namespace-region-owns-invocation');
  if (regions.length !== 1) return incomplete(input, 'multiple-namespace-regions-own-invocation');

  const region = regions[0];
  const environment = Object.freeze({
    kind: 'complete_function_resolution_environment' as const,
    sourceFile: input.inventory.sourceFile,
    scope: scopeOf(region),
    completeness: region.completeness,
  });
  return Object.freeze({
    kind: 'php_function_resolution_environment_projection_complete',
    inventory: input.inventory,
    invocationSource: input.invocationSource,
    judgment: Object.freeze({ kind: 'function_resolution_environment_complete', environment }),
  });
};

export const phpFunctionResolutionEnvironmentProjectionAuthority: PhpFunctionResolutionEnvironmentProjectionInterface = Object.freeze({
  kind: 'php_function_resolution_environment_projection_authority',
  contract: PHP_FUNCTION_RESOLUTION_ENVIRONMENT_PROJECTION_CONTRACT,
  project,
});
