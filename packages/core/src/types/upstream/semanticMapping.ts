import type { UpstreamWiringInterface } from '../interfaces/interfaceDependencyBoundary';
import type { SemanticReasoningContract } from './semanticReasoning';
import type { SemanticType } from '../domain/semanticType';
import type { PropertyName, ResourceName, FormTypeName } from '../domain/semanticValues';
import { IdentifierCase } from '../../utils/naming';
import { relationProject } from '../../semantic/foundation/relationalSequence';

export type SemanticMappingDirection = 'read' | 'write';
export type SemanticMappingKind = 'direct' | 'object' | 'resource' | 'collection' | 'resource_collection';

export interface SemanticMappingField {
  readonly source: string;
  readonly target: string;
  readonly kind: SemanticMappingKind;
  readonly resourceName?: string;
  readonly mapperName?: string;
  readonly fields: readonly SemanticMappingField[];
  readonly element?: SemanticMappingField;
}

export interface SemanticReadMapperContract {
  readonly resourceName: string;
  readonly mapperName: string;
  readonly listMapperName: string;
  readonly apiResponseType: string;
  readonly transformedType: string;
  readonly fields: readonly SemanticMappingField[];
}

export interface SemanticWriteMapperField {
  readonly source: string;
  readonly target: string;
}

export interface SemanticWriteMapperContract {
  readonly resourceName: string;
  readonly actionName: string;
  readonly functionName: string;
  readonly formTypeName: string;
  readonly contractTypeName: string;
  readonly fields: readonly SemanticWriteMapperField[];
}

export interface SemanticMappingEvidence {
  readonly kind: 'semantic_mapping_evidence';
  readonly closed: true;
  readonly directions: readonly SemanticMappingDirection[];
}

export interface SemanticMappingContractInterface {
  readonly kind: 'semantic_mapping_contract';
  readonly authority: 'upstream';
  readonly reasoning: SemanticReasoningContract;
  readonly evidence: SemanticMappingEvidence;
  readonly read: readonly SemanticReadMapperContract[];
  readonly write: readonly SemanticWriteMapperContract[];
  readonly closed: true;
}

export interface SemanticMappingContract extends SemanticMappingContractInterface {}

/** Mapper semantic contract aliases: the mapper is a projection domain, not a classifier. */
export interface MapperContract extends SemanticMappingContract {}
export interface MapperInterface extends SemanticMappingConsumerInterface {}
export interface MapperConsumerInterface extends SemanticMappingConsumerInterface {}
export interface MapperWiringInterface<Downstream> extends UpstreamWiringInterface<MapperConsumerInterface, Downstream> {}

export interface SemanticMappingConsumerInterface extends SemanticMappingContractInterface {}

export interface SemanticMappingWiringInterface<Downstream>
  extends UpstreamWiringInterface<SemanticMappingConsumerInterface, Downstream> {}

const camel = (value: string): string => IdentifierCase.toCamel(value);
const pascal = (value: string): string => IdentifierCase.toPascal(value);

const field = (source: PropertyName, kind: SemanticMappingKind, children: readonly SemanticMappingField[] = [], extra: Partial<SemanticMappingField> = {}): SemanticMappingField => Object.freeze({
  source: source.value.value,
  target: camel(source.value.value),
  kind,
  fields: children,
  ...extra,
});

const resolveField = (source: PropertyName, type: SemanticType): SemanticMappingField => {
  switch (type.kind) {
    case 'object': {
      const children = relationProject(type.properties, property => resolveField(property.name, property.type));
      return field(source, type.role === 'resource' ? 'resource' : 'object', children, type.role === 'resource' ? {
        resourceName: type.name.endsWith('Resource') ? type.name.slice(0, -8) : type.name,
        mapperName: `to${pascal(type.name.endsWith('Resource') ? type.name.slice(0, -8) : type.name)}Read`,
      } : {});
    }
    case 'readonly_collection':
    case 'mutable_collection': {
      const element = resolveField(source, type.elementType);
      return field(source, element.kind === 'resource' ? 'resource_collection' : 'collection', [], {
        resourceName: element.resourceName,
        mapperName: element.mapperName,
        element,
      });
    }
    case 'reference':
      return field(source, type.name.endsWith('Resource') ? 'resource' : 'direct', [], type.name.endsWith('Resource') ? {
        resourceName: type.name.slice(0, -8),
        mapperName: `to${pascal(type.name.slice(0, -8))}Read`,
      } : {});
    case 'optional':
    case 'nullable':
      return resolveField(source, type.innerType);
    default:
      return field(source, 'direct');
  }
};

export function semanticReadMapperFromResource(
  resource: ResourceName,
  fields: readonly { readonly name: PropertyName; readonly type: SemanticType }[],
): SemanticReadMapperContract {
  const resourceName = resource.value.value;
  const pascalName = pascal(resourceName);
  return Object.freeze({
    resourceName,
    mapperName: `to${pascalName}Read`,
    listMapperName: `to${pascalName}ReadList`,
    apiResponseType: `${pascalName}ApiResponse`,
    transformedType: `${pascalName}Transformed`,
    fields: Object.freeze(relationProject(fields, item => resolveField(item.name, item.type))),
  });
}

export function semanticWriteMapperFromAction(
  resource: ResourceName,
  actionName: string,
  formType: FormTypeName,
  fields: readonly { readonly sourceName: PropertyName }[],
): SemanticWriteMapperContract {
  const resourceName = resource.value.value;
  const pascalName = pascal(resourceName);
  const actionPascal = pascal(actionName);
  return Object.freeze({
    resourceName,
    actionName,
    functionName: `toApi${pascalName}${actionPascal}`,
    formTypeName: formType.value.value,
    contractTypeName: `${pascalName}Contract`,
    fields: Object.freeze(relationProject(fields, item => Object.freeze({
      source: item.sourceName.value.value,
      target: item.sourceName.value.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    }))),
  });
}
