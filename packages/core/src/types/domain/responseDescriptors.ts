import type { PrimitiveBody, ResponseBody } from './responseBody';
import type { ObjectProperty } from "./semanticType";
import type { SemanticType } from "./semanticType";
import { relationProject } from '../../semantic/foundation/relationalSequence';
import type { ResponseContract } from "./responseContracts";
import type { ResourceFieldSemanticBinding } from "./resourceFieldSemanticBinding";
import { requireResourceFieldType } from './resourceFieldSemantic';
import { SemanticValueFactory } from "./semanticValues";
import type { ClassName, DomainName, ModelName, ResourceName, ResponseFieldName, ResponseTypeName, RouteName, SourceFilePath } from "./semanticValues";
import {
  ResponseShape,
  type PaginatedEnvelopeDescriptor,
  type PolymorphicRelationDescriptor
} from "./responseShapes";

export interface RouteResponseAnalysisBase {
  readonly routeName: RouteName;
  readonly shape: ResponseShape;
}

export interface ResourceRouteResponseAnalysis extends RouteResponseAnalysisBase {
  readonly kind: 'resource';
  readonly resourceName: ResourceName;
}

export interface ModelRouteResponseAnalysis extends RouteResponseAnalysisBase {
  readonly kind: 'model';
  readonly modelName: ModelName;
}

export interface InlineRouteResponseAnalysis extends RouteResponseAnalysisBase {
  readonly kind: 'inline';
  readonly typeName: ResponseTypeName;
}

export interface VoidRouteResponseAnalysis extends RouteResponseAnalysisBase {
  readonly kind: 'void';
}

export type RouteResponseAnalysis =
  | ResourceRouteResponseAnalysis
  | ModelRouteResponseAnalysis
  | InlineRouteResponseAnalysis
  | VoidRouteResponseAnalysis;

export interface ResponseDescriptorBase {
  readonly kind: ResponseKind;
  readonly shape: ResponseShape;
  readonly responseTypeName: () => ResponseTypeName;
  readonly toSuccessStatusCode: () => number;
  readonly toAnalysis: (routeName: RouteName, confidence: number) => RouteResponseAnalysis;
  readonly toResponseBody: () => ResponseBody;
}

export interface ResourceResponseParams {
  readonly resourceName: ResourceName;
  readonly shape: ResponseShape;
}

export interface ResourceResponseDescriptor extends ResponseDescriptorBase {
  readonly kind: 'resource';
  readonly resourceName: ResourceName;
}

const resourceDescriptor = (params: ResourceResponseParams): ResourceResponseDescriptor => {
  const resourceName = params.resourceName;
  const shape = params.shape;
  const descriptor: ResourceResponseDescriptor = {
    kind: 'resource',
    resourceName,
    shape,
    responseTypeName: () => SemanticValueFactory.responseTypeName(`${resourceName.value.value}Response`),
    toSuccessStatusCode: () => 200,
    toAnalysis: (routeName) => ({ routeName, kind: 'resource', shape, resourceName }),
    toResponseBody: () => ({ type: 'resource', resource: resourceName.value.value, shape }),
  };
  return Object.freeze(descriptor);
};

export const ResourceResponseDescriptor = Object.freeze({
  create: ({ resourceName, shape = 'single' }: { readonly resourceName: ResourceName; readonly shape?: ResponseShape }) => resourceDescriptor({ resourceName, shape }),
  single: (resourceName: ResourceName) => resourceDescriptor({ resourceName, shape: 'single' }),
  collection: (resourceName: ResourceName) => resourceDescriptor({ resourceName, shape: 'collection' }),
});

export interface ModelResponseParams {
  readonly modelName: ModelName;
  readonly shape: ResponseShape;
}

export interface ModelResponseDescriptor extends ResponseDescriptorBase {
  readonly kind: 'model';
  readonly modelName: ModelName;
}

const modelDescriptor = (params: ModelResponseParams): ModelResponseDescriptor => {
  const modelName = params.modelName;
  const shape = params.shape;
  const descriptor: ModelResponseDescriptor = {
    kind: 'model',
    modelName,
    shape,
    responseTypeName: () => SemanticValueFactory.responseTypeName(`${modelName.value.value}Response`),
    toSuccessStatusCode: () => 200,
    toAnalysis: (routeName) => ({ routeName, kind: 'model', shape, modelName }),
    toResponseBody: () => ({ type: 'model', model: modelName.value.value, shape }),
  };
  return Object.freeze(descriptor);
};

export const ModelResponseDescriptor = Object.freeze({
  create: ({ modelName, shape = 'single' }: { readonly modelName: ModelName; readonly shape?: ResponseShape }) => modelDescriptor({ modelName, shape }),
  single: (modelName: ModelName) => modelDescriptor({ modelName, shape: 'single' }),
  collection: (modelName: ModelName) => modelDescriptor({ modelName, shape: 'collection' }),
});

export interface VoidResponseDescriptor extends ResponseDescriptorBase {
  readonly kind: 'void';
}

const voidDescriptor = (): VoidResponseDescriptor => {
  const descriptor: VoidResponseDescriptor = {
    kind: 'void',
    shape: 'single',
    responseTypeName: () => SemanticValueFactory.responseTypeName('void'),
    toSuccessStatusCode: () => 204,
    toAnalysis: (routeName: RouteName): VoidRouteResponseAnalysis => ({ routeName, kind: 'void', shape: 'single' }),
    toResponseBody: (): PrimitiveBody => ({ type: 'primitive', primitiveType: 'void', shape: 'single' }),
  };
  return Object.freeze(descriptor);
};

export const VoidResponseDescriptor = Object.freeze({ create: voidDescriptor });

export type ResponseSemanticProperty = ObjectProperty;

/** Compatibility name for the canonical domain ResponseContract. */
export type ResponseSemanticContract = ResponseContract;

export type ResponseOriginTraceEntry =
  | { readonly kind: 'class_resolution'; readonly className: ClassName; readonly sourceFile: SourceFilePath }
  | { readonly kind: 'property_extraction'; readonly propertyCount: number }
  | { readonly kind: 'semantic_resolution'; readonly resolvedCount: number }
  | { readonly kind: 'observed_return'; readonly fieldCount: number };

export type ResponseDescriptorOrigin =
  | { readonly kind: 'attribute'; readonly className: ClassName; readonly sourceFile: SourceFilePath; readonly trace: readonly ResponseOriginTraceEntry[] }
  | { readonly kind: 'inferred'; readonly sourceFile: SourceFilePath; readonly trace: readonly ResponseOriginTraceEntry[] };

export interface InlineResponseDescriptorParams {
  readonly domain: DomainName;
  readonly baseName: ResourceName;
  readonly typeName: ResponseTypeName;
  readonly fields: readonly ResourceFieldSemanticBinding[];
  readonly shape: ResponseShape;
  readonly origin: ResponseDescriptorOrigin;
  readonly semanticContract: ResponseSemanticContract;
}

export interface InlineResponseDescriptor extends ResponseDescriptorBase {
  readonly kind: 'inline';
  readonly domain: DomainName;
  readonly baseName: ResourceName;
  readonly typeName: ResponseTypeName;
  readonly fields: readonly ResourceFieldSemanticBinding[];
  readonly origin: ResponseDescriptorOrigin;
  readonly semanticContract: ResponseSemanticContract;
}

const inlineDescriptor = (params: InlineResponseDescriptorParams): InlineResponseDescriptor => {
  const fields = Object.freeze([...params.fields]);
  const shape = params.shape;
  const typeName = params.typeName;
  const baseName = params.baseName;
  const descriptor: InlineResponseDescriptor = {
    kind: 'inline',
    domain: params.domain,
    baseName,
    typeName,
    fields,
    shape,
    origin: params.origin,
    semanticContract: params.semanticContract,
    responseTypeName: () => typeName,
    toSuccessStatusCode: () => 200,
    toAnalysis: (routeName) => ({ routeName, kind: 'inline', shape, typeName }),
    toResponseBody: () => ({
      type: 'object',
      schema: {
        name: baseName.value.value,
        properties: Object.freeze(relationProject(fields, field => ({
          name: field.name.value,
          type: semanticTypeToPropertyType(requireResourceFieldType(field.semantic)),
          required: !requireResourceFieldType(field.semantic).isNullable(),
        }))),
        additionalProperties: false,
      },
      shape,
    }),
  };
  return Object.freeze(descriptor);
};

export const InlineResponseDescriptor = Object.freeze({
  create: ({ domain, baseName = SemanticValueFactory.resourceName(domain.value.value), typeName = SemanticValueFactory.responseTypeName(`${baseName.value.value}Transformed`), fields, shape = ResponseShape.Single, origin, semanticContract }: {
    readonly domain: DomainName;
    readonly baseName?: ResourceName;
    readonly typeName?: ResponseTypeName;
    readonly fields: readonly ResourceFieldSemanticBinding[];
    readonly shape?: ResponseShape;
    readonly origin: ResponseDescriptorOrigin;
    readonly semanticContract: ResponseSemanticContract;
  }) => inlineDescriptor({ domain, baseName, typeName, fields, shape, origin, semanticContract }),
});

function semanticTypeToPropertyType(type: SemanticType): { readonly kind: 'scalar'; readonly typeName: string; readonly nullable: boolean } {
  return type.accept({
    primitive: value => ({ kind: 'scalar' as const, typeName: value.type, nullable: false }),
    jsonValue: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
    nullable: value => ({ ...semanticTypeToPropertyType(value.innerType), nullable: true }),
    reference: value => ({ kind: 'scalar' as const, typeName: value.name, nullable: false }),
    optional: value => ({ ...semanticTypeToPropertyType(value.innerType), nullable: true }),
    readonlyCollection: () => ({ kind: 'scalar' as const, typeName: 'array', nullable: false }),
    mutableCollection: () => ({ kind: 'scalar' as const, typeName: 'array', nullable: false }),
    generic: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
    union: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
    intersection: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
    object: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
    never: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
    error: value => ({ kind: 'scalar' as const, typeName: 'unknown', nullable: value.isNullable() }),
  });
}

export const ResponseKind = Object.freeze({
  Resource: 'resource',
  Model: 'model',
  Inline: 'inline',
  Void: 'void'
} as const);

export type ResponseKind = typeof ResponseKind[keyof typeof ResponseKind];

export type ResponseDescriptor =
  | ResourceResponseDescriptor
  | ModelResponseDescriptor
  | InlineResponseDescriptor
  | VoidResponseDescriptor;

export interface ResponseKindSpecification<K extends ResponseKind = ResponseKind> {
  readonly kind: K;
  readonly hasSchema: boolean;
  readonly hasMapper: boolean;
  readonly defaultStatusCode: number;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key ResponseKind.
 */
export type ResponseDescriptorRegistry = {
  readonly [K in ResponseKind]: ResponseKindSpecification<K>;
};

export const RESPONSE_DESCRIPTOR_REGISTRY: ResponseDescriptorRegistry = Object.freeze({
  [ResponseKind.Resource]: {
    kind: ResponseKind.Resource,
    hasSchema: true,
    hasMapper: true,
    defaultStatusCode: 200,
  },
  [ResponseKind.Model]: {
    kind: ResponseKind.Model,
    hasSchema: true,
    hasMapper: false,
    defaultStatusCode: 200,
  },
  [ResponseKind.Inline]: {
    kind: ResponseKind.Inline,
    hasSchema: true,
    hasMapper: true,
    defaultStatusCode: 200,
  },
  [ResponseKind.Void]: {
    kind: ResponseKind.Void,
    hasSchema: false,
    hasMapper: false,
    defaultStatusCode: 204,
  },
});

export interface ResponseVisitor<R> {
  readonly resource: (desc: ResourceResponseDescriptor) => R;
  readonly model: (desc: ModelResponseDescriptor) => R;
  readonly inline: (desc: InlineResponseDescriptor) => R;
  readonly void: (desc: VoidResponseDescriptor) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian ResponseDescriptor dengan exhaustive type safety
 */
export function matchResponse<R>(
  descriptor: ResponseDescriptor,
  visitor: ResponseVisitor<R>
): R {
  const handlers = {
    resource: visitor.resource,
    model: visitor.model,
    inline: visitor.inline,
    void: visitor.void,
  } as const;
  return handlers[descriptor.kind](descriptor as never);
}
