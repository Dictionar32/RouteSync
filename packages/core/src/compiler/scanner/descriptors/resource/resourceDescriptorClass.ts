/**
 * Canonical scanned resource descriptor.
 * The descriptor is a structural semantic witness produced by an immutable
 * catalog rather than a host-language constructor.
 */
import type {
  ResourceFieldDescriptor,
  ParsedResource,
} from '../../../../types/route';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResourceName, ResponseTypeName } from '../../../../types/upstream/names';
import { toCamelCase, ResourceNamingConvention } from '../../../../utils/resource-naming';
import { ScannedResourceParams, CreateResourceDescriptorOptions } from './resourceDescriptorTypes';

export { ScannedResourceParams, CreateResourceDescriptorOptions };

export type ScannedResourceDescriptor = ParsedResource;

const createResourceDescriptor = (params: ScannedResourceParams): ScannedResourceDescriptor => {
  const identity = Object.freeze({
    name: params.name,
    baseName: params.baseName,
    typeName: params.typeName,
  });
  const binding = Object.freeze({
    model: { kind: 'model' as const, modelName: params.modelName },
  });
  const surface = Object.freeze({
    sanitizedName: SemanticValueFactory.propertyName(toCamelCase(params.name.value.value)),
    fields: Object.freeze(params.fields),
    assignments: Object.freeze(params.assignments),
  });
  const provenance = Object.freeze({
    sourceFile: params.sourceFile,
    sourceLine: SemanticValueFactory.sourceLineNumber(params.sourceLine),
    synthetic: params.isSynthetic,
  });
  return Object.freeze({ identity, binding, surface, provenance });
};

export const ScannedResourceDescriptor = Object.freeze({
  create({
    name,
    fields,
    sourceFile,
    sourceLine,
    assignments,
    modelName,
    isSynthetic,
  }: CreateResourceDescriptorOptions): ScannedResourceDescriptor {
    const baseNameValue = ResourceNamingConvention.stripSuffix(name.value.value);
    const baseName: ResourceName = SemanticValueFactory.resourceName(baseNameValue);
    const typeName: ResponseTypeName = SemanticValueFactory.responseTypeName(ResourceNamingConvention.toTransformedName(baseNameValue));
    return createResourceDescriptor({
      name,
      baseName,
      typeName,
      modelName,
      fields,
      assignments,
      sourceFile,
      sourceLine,
      isSynthetic,
    });
  },
});
