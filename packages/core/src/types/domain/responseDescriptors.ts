import type { ResponseBody } from "../../compiler/ir/ResponseArtifact";
import type { ObjectProperty } from "../../compiler/types/SemanticType";
import { PrimitiveKind, type SemanticType } from "../../compiler/types/SemanticType";
import type { ResponseContract } from "./responseContracts";
import type { ResourceFieldDescriptor } from "./expressions";
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

export abstract class ResponseDescriptorBase {
  abstract readonly kind: ResponseKind;
  abstract readonly shape: ResponseShape;
  abstract toAnalysis(routeName: RouteName, confidence: number): RouteResponseAnalysis;
  abstract toResponseBody(): ResponseBody;
}

export interface ResourceResponseParams {
  readonly resourceName: ResourceName;
  readonly shape: ResponseShape;
}

export class ResourceResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'resource' as const;
  public readonly shape: ResponseShape;
  public readonly resourceName: ResourceName;
  constructor(params: ResourceResponseParams) {
    super();
    this.resourceName = params.resourceName;
    this.shape = params.shape;
    Object.freeze(this);
  }

  public static create({
    resourceName,
    shape = 'single'
  }: {
    readonly resourceName: ResourceName;
    readonly shape?: ResponseShape;
  }): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape });
  }

  public static single(resourceName: ResourceName): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'single' });
  }

  public static collection(resourceName: ResourceName): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'collection' });
  }

  toAnalysis(routeName: RouteName, _confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      kind: this.kind,
      shape: this.shape,
      resourceName: this.resourceName,
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'resource',
      resource: this.resourceName.value,
      shape: this.shape
    };
  }
}

export interface ModelResponseParams {
  readonly modelName: ModelName;
  readonly shape: ResponseShape;
}

export class ModelResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'model' as const;
  public readonly shape: ResponseShape;
  public readonly modelName: ModelName;
  constructor(params: ModelResponseParams) {
    super();
    this.modelName = params.modelName;
    this.shape = params.shape;
    Object.freeze(this);
  }

  public static create({
    modelName,
    shape = 'single'
  }: {
    readonly modelName: ModelName;
    readonly shape?: ResponseShape;
  }): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape });
  }

  public static single(modelName: ModelName): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'single' });
  }

  public static collection(modelName: ModelName): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'collection' });
  }

  toAnalysis(routeName: RouteName, _confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      kind: this.kind,
      shape: this.shape,
      modelName: this.modelName,
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'model',
      model: this.modelName.value,
      shape: this.shape
    };
  }
}

export class VoidResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'void' as const;
  public readonly shape = 'single' as const;
  constructor() {
    super();
    Object.freeze(this);
  }

  toAnalysis(routeName: RouteName, _confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      kind: this.kind,
      shape: this.shape,
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'primitive',
      primitiveType: 'void',
      shape: 'single'
    };
  }
}

export type ResponseSemanticProperty = ObjectProperty;

export type ResponseSemanticContract = ResponseContract;

export type ResponseOriginTraceEntry =
  | { readonly kind: 'class_resolution'; readonly className: ClassName; readonly sourceFile: SourceFilePath }
  | { readonly kind: 'property_extraction'; readonly propertyCount: number }
  | { readonly kind: 'semantic_resolution'; readonly resolvedCount: number };

export type ResponseDescriptorOrigin =
  | { readonly kind: 'attribute'; readonly className: ClassName; readonly sourceFile: SourceFilePath; readonly trace: readonly ResponseOriginTraceEntry[] }
  | { readonly kind: 'inferred'; readonly sourceFile: SourceFilePath; readonly trace: readonly ResponseOriginTraceEntry[] };

export interface InlineResponseDescriptorParams {
  readonly domain: DomainName;
  readonly baseName: ResourceName;
  readonly typeName: ResponseTypeName;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly shape: ResponseShape;
  readonly origin: ResponseDescriptorOrigin;
  readonly semanticContract: ResponseSemanticContract;
}

export class InlineResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'inline' as const;
  public readonly shape: ResponseShape;
  public readonly domain: DomainName;
  public readonly baseName: ResourceName;
  public readonly typeName: ResponseTypeName;
  public readonly fields: readonly ResourceFieldDescriptor[];
  public readonly origin: ResponseDescriptorOrigin;
  public readonly semanticContract: ResponseSemanticContract;

  constructor(params: InlineResponseDescriptorParams) {
    super();
    this.domain = params.domain;
    this.baseName = params.baseName;
    this.typeName = params.typeName;
    this.fields = Object.freeze([...params.fields]);
    this.shape = params.shape;
    this.origin = params.origin;
    this.semanticContract = params.semanticContract;
    Object.freeze(this);
  }

  public static create({
    domain,
    baseName = SemanticValueFactory.resourceName(domain.value),
    typeName = SemanticValueFactory.responseTypeName(`${baseName.value}Transformed`),
    fields,
    shape = ResponseShape.Single,
    origin,
    semanticContract
  }: {
    readonly domain: DomainName;
    readonly baseName?: ResourceName;
    readonly typeName?: ResponseTypeName;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly shape?: ResponseShape;
    readonly origin: ResponseDescriptorOrigin;
    readonly semanticContract: ResponseSemanticContract;
  }): InlineResponseDescriptor {
    return new InlineResponseDescriptor({
      domain,
      baseName,
      typeName,
      fields,
      shape,
      origin,
      semanticContract
    });
  }

  toAnalysis(routeName: RouteName, _confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      kind: this.kind,
      shape: this.shape,
      typeName: this.typeName,
    };
  }

  toResponseBody(): ResponseBody {
    const properties = this.fields.map(f => ({
      name: f.name.value,
      type: semanticTypeToPropertyType(f.semanticType),
      required: !f.semanticType.isNullable()
    }));
    return {
      type: 'object',
      schema: {
        name: this.baseName.value,
        properties,
        additionalProperties: false
      },
      shape: this.shape
    };
  }
}

function semanticTypeToPropertyType(type: SemanticType): {
  readonly kind: 'scalar';
  readonly typeName: string;
  readonly nullable: boolean;
} {
  switch (type.kind) {
    case 'primitive':
      return {
        kind: 'scalar',
        typeName: type.type,
        nullable: false
      };
    case 'nullable': {
      const inner = semanticTypeToPropertyType(type.innerType);
      return { ...inner, nullable: true };
    }
    case 'reference':
      return {
        kind: 'scalar',
        typeName: type.name,
        nullable: false
      };
    case 'optional': {
      const inner = semanticTypeToPropertyType(type.innerType);
      return { ...inner, nullable: true };
    }
    case 'readonly_collection':
    case 'mutable_collection':
      return {
        kind: 'scalar',
        typeName: 'array',
        nullable: false
      };
    case 'generic':
    case 'union':
    case 'intersection':
    case 'object':
    case 'never':
    case 'error':
      return {
        kind: 'scalar',
        typeName: 'unknown',
        nullable: type.isNullable()
      };
  }
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
  switch (descriptor.kind) {
    case ResponseKind.Resource: return visitor.resource(descriptor);
    case ResponseKind.Model: return visitor.model(descriptor);
    case ResponseKind.Inline: return visitor.inline(descriptor);
    case ResponseKind.Void: return visitor.void(descriptor);
  }
}
