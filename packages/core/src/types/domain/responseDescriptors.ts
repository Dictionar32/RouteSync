import type { ResponseBody } from "../../compiler/ir/ResponseArtifact";
import { toPascalCase } from "../../utils/resource-naming";
import type { ResourceFieldDescriptor } from "./expressions";
import {
  ResponseShape,
  type PaginatedEnvelopeDescriptor,
  type PolymorphicRelationDescriptor
} from "./responseShapes";

export interface RouteResponseAnalysis {
  readonly routeName: string;
  readonly responseType: string;
  readonly shape: ResponseShape;
  readonly resourceName: string | null;
  readonly modelName: string | null;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

export abstract class ResponseDescriptorBase {
  abstract readonly kind: string;
  abstract readonly shape: ResponseShape;
  abstract readonly readTypeName: string; // ✅ Guaranteed Read Type Name ('UserResourceTransformed')
  abstract readonly mapperName: string;   // ✅ Guaranteed Mapper Function Name ('toUserResourceRead')
  abstract readonly validatorName: string; // ✅ Guaranteed Contract Validator Name ('validateUserResourceSchema')

  abstract toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis;
  abstract toResponseBody(): ResponseBody;
}

export interface ResourceResponseParams {
  readonly resourceName: string;
  readonly shape: ResponseShape;
}

export class ResourceResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'resource' as const;
  public readonly shape: ResponseShape;
  public readonly resourceName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;

  constructor(params: ResourceResponseParams) {
    super();
    this.resourceName = params.resourceName;
    this.shape = params.shape;
    this.readTypeName = `${params.resourceName}Transformed`;
    this.mapperName = `to${params.resourceName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.resourceName)}Index`
      : `validate${toPascalCase(params.resourceName)}Schema`;
    Object.freeze(this);
  }

  public static create({
    resourceName = 'UnknownResource',
    shape = 'single'
  }: {
    readonly resourceName?: string;
    readonly shape?: ResponseShape;
  } = {}): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape });
  }

  public static single(resourceName: string): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'single' });
  }

  public static collection(resourceName: string): ResourceResponseDescriptor {
    return new ResourceResponseDescriptor({ resourceName, shape: 'collection' });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: this.resourceName,
      modelName: null,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'resource',
      resource: this.resourceName,
      shape: this.shape
    };
  }
}

export interface ModelResponseParams {
  readonly modelName: string;
  readonly shape: ResponseShape;
}

export class ModelResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'model' as const;
  public readonly shape: ResponseShape;
  public readonly modelName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;

  constructor(params: ModelResponseParams) {
    super();
    this.modelName = params.modelName;
    this.shape = params.shape;
    this.readTypeName = `${params.modelName}Transformed`;
    this.mapperName = `to${params.modelName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.modelName)}Index`
      : `validate${toPascalCase(params.modelName)}Schema`;
    Object.freeze(this);
  }

  public static create({
    modelName = 'UnknownModel',
    shape = 'single'
  }: {
    readonly modelName?: string;
    readonly shape?: ResponseShape;
  } = {}): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape });
  }

  public static single(modelName: string): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'single' });
  }

  public static collection(modelName: string): ModelResponseDescriptor {
    return new ModelResponseDescriptor({ modelName, shape: 'collection' });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: null,
      modelName: this.modelName,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    return {
      type: 'model',
      model: this.modelName,
      shape: this.shape
    };
  }
}

export class VoidResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'void' as const;
  public readonly shape = 'single' as const;
  public readonly readTypeName = 'void';
  public readonly mapperName = 'identity';
  public readonly validatorName = 'undefined';

  constructor() {
    super();
    Object.freeze(this);
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.kind,
      shape: this.shape,
      resourceName: null,
      modelName: null,
      confidence,
      reasons: [
        `Response kind: ${this.kind}`,
        `Response shape: ${this.shape}`
      ]
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

export interface InlineResponseDescriptorParams {
  readonly domain: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly shape: ResponseShape;
}

export class InlineResponseDescriptor extends ResponseDescriptorBase {
  public readonly kind = 'inline' as const;
  public readonly shape: ResponseShape;
  public readonly domain: string;
  public readonly baseName: string;
  public readonly typeName: string;
  public readonly readTypeName: string;
  public readonly mapperName: string;
  public readonly validatorName: string;
  public readonly fields: readonly ResourceFieldDescriptor[];

  constructor(params: InlineResponseDescriptorParams) {
    super();
    this.domain = params.domain;
    this.baseName = params.baseName;
    this.typeName = params.typeName;
    this.readTypeName = params.typeName;
    this.mapperName = `to${params.baseName}Read`;
    this.validatorName = (params.shape === 'collection' || params.shape === 'paginated')
      ? `validate${toPascalCase(params.baseName)}Index`
      : `validate${toPascalCase(params.baseName)}Schema`;
    this.fields = Object.freeze([...params.fields]);
    this.shape = params.shape;
    Object.freeze(this);
  }

  public static create({
    domain,
    baseName = domain,
    typeName = `${baseName}Transformed`,
    fields,
    shape = ResponseShape.Single
  }: {
    readonly domain: string;
    readonly baseName?: string;
    readonly typeName?: string;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly shape?: ResponseShape;
  }): InlineResponseDescriptor {
    return new InlineResponseDescriptor({
      domain,
      baseName,
      typeName,
      fields,
      shape
    });
  }

  toAnalysis(routeName: string, confidence: number): RouteResponseAnalysis {
    return {
      routeName,
      responseType: this.typeName,
      shape: this.shape,
      resourceName: null,
      modelName: null,
      confidence,
      reasons: [
        `Inline response with ${this.fields.length} fields`,
        `Response shape: ${this.shape}`
      ]
    };
  }

  toResponseBody(): ResponseBody {
    const properties: Record<string, { readonly typeName: string; readonly nullable: boolean }> = {};
    for (const f of this.fields) {
      properties[f.name] = { typeName: 'string', nullable: f.nullable };
    }
    return {
      type: 'object',
      schema: {
        properties
      },
      shape: this.shape
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
  return visitor[descriptor.kind](descriptor as any);
}
