import { SdkResponseKind } from "./lifecycle";
import type { ResponseDescriptor } from "./responseDescriptors";

export interface SdkResponseResolution {
  readonly kind: SdkResponseKind;
  readonly type: string;
  readonly hasSchema: boolean;
  readonly schemaExpression: string;
  readonly hasMapper: boolean;
  readonly mapperExpression: string;
}

export interface VoidSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'void';
  readonly type: 'void';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface RawSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'raw';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface ValidatedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'validated';
  readonly hasSchema: true;
  readonly hasMapper: false;
  readonly mapperExpression: '';
}

export interface MappedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'mapped';
  readonly hasSchema: false;
  readonly schemaExpression: '';
  readonly hasMapper: true;
}

export interface ValidatedAndMappedSdkResponseResolution extends SdkResponseResolution {
  readonly kind: 'validated_and_mapped';
  readonly hasSchema: true;
  readonly hasMapper: true;
}

export type AnySdkResponseResolution =
  | VoidSdkResponseResolution
  | RawSdkResponseResolution
  | ValidatedSdkResponseResolution
  | MappedSdkResponseResolution
  | ValidatedAndMappedSdkResponseResolution;

export interface SdkResponseKindSpecification<K extends SdkResponseKind = SdkResponseKind> {
  readonly kind: K;
  readonly hasSchema: boolean;
  readonly hasMapper: boolean;
  readonly isTransformed: boolean;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key SdkResponseKind.
 */
export type SdkResponseKindRegistry = {
  readonly [K in SdkResponseKind]: SdkResponseKindSpecification<K>;
};

export const SDK_RESPONSE_KIND_REGISTRY: SdkResponseKindRegistry = Object.freeze({
  [SdkResponseKind.Void]: {
    kind: SdkResponseKind.Void,
    hasSchema: false,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Raw]: {
    kind: SdkResponseKind.Raw,
    hasSchema: false,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Validated]: {
    kind: SdkResponseKind.Validated,
    hasSchema: true,
    hasMapper: false,
    isTransformed: false
  },
  [SdkResponseKind.Mapped]: {
    kind: SdkResponseKind.Mapped,
    hasSchema: false,
    hasMapper: true,
    isTransformed: true
  },
  [SdkResponseKind.ValidatedAndMapped]: {
    kind: SdkResponseKind.ValidatedAndMapped,
    hasSchema: true,
    hasMapper: true,
    isTransformed: true
  }
});

export interface SdkResponseResolutionVisitor<R> {
  readonly void: (res: VoidSdkResponseResolution) => R;
  readonly raw: (res: RawSdkResponseResolution) => R;
  readonly validated: (res: ValidatedSdkResponseResolution) => R;
  readonly mapped: (res: MappedSdkResponseResolution) => R;
  readonly validated_and_mapped: (res: ValidatedAndMappedSdkResponseResolution) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian SdkResponseResolution dengan exhaustive type safety
 */
export function matchSdkResponseResolution<R>(
  resolution: SdkResponseResolution,
  visitor: SdkResponseResolutionVisitor<R>
): R {
  return visitor[resolution.kind](resolution as any);
}

export const matchSdkResponse = matchSdkResponseResolution;

export class ScannedSdkResponseResolution implements SdkResponseResolution {
  public readonly kind: SdkResponseKind;
  public readonly type: string;
  public readonly hasSchema: boolean;
  public readonly schemaExpression: string;
  public readonly hasMapper: boolean;
  public readonly mapperExpression: string;

  constructor({
    kind,
    type,
    hasSchema,
    schemaExpression,
    hasMapper,
    mapperExpression
  }: {
    readonly kind: SdkResponseKind;
    readonly type: string;
    readonly hasSchema: boolean;
    readonly schemaExpression: string;
    readonly hasMapper: boolean;
    readonly mapperExpression: string;
  }) {
    this.kind = kind;
    this.type = type;
    this.hasSchema = hasSchema;
    this.schemaExpression = schemaExpression;
    this.hasMapper = hasMapper;
    this.mapperExpression = mapperExpression;
    Object.freeze(this);
  }

  public static voidResponse(): VoidSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Void,
      type: 'void',
      hasSchema: false,
      schemaExpression: '',
      hasMapper: false,
      mapperExpression: ''
    }) as VoidSdkResponseResolution;
  }

  public static raw(readTypeName: string): RawSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Raw,
      type: readTypeName,
      hasSchema: false,
      schemaExpression: '',
      hasMapper: false,
      mapperExpression: ''
    }) as RawSdkResponseResolution;
  }

  public static validated(readTypeName: string, schemaExpression: string): ValidatedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Validated,
      type: readTypeName,
      hasSchema: true,
      schemaExpression,
      hasMapper: false,
      mapperExpression: ''
    }) as ValidatedSdkResponseResolution;
  }

  public static mapped(readTypeName: string, mapperExpression: string): MappedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Mapped,
      type: readTypeName,
      hasSchema: false,
      schemaExpression: '',
      hasMapper: true,
      mapperExpression
    }) as MappedSdkResponseResolution;
  }

  public static validatedAndMapped(
    readTypeName: string,
    schemaExpression: string,
    mapperExpression: string
  ): ValidatedAndMappedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.ValidatedAndMapped,
      type: readTypeName,
      hasSchema: true,
      schemaExpression,
      hasMapper: true,
      mapperExpression
    }) as ValidatedAndMappedSdkResponseResolution;
  }
}


export type ResponseMetadata = ResponseDescriptor;
