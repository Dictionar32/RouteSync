import type { RouteHookKind } from "./crudRoles";
export const RoutePayloadMode = Object.freeze({
  None: 'none',
  Required: 'required',
  Optional: 'optional'
} as const);
export type RoutePayloadMode = typeof RoutePayloadMode[keyof typeof RoutePayloadMode];

export interface BaseRouteExecutionSignature {
  readonly payloadMode: RoutePayloadMode;
  readonly parameterDeclaration: string;
  readonly callArgumentsExpression: string;
  readonly hasPayload: boolean;
  readonly isOptional: boolean;
}

export interface NoPayloadExecutionSignature extends BaseRouteExecutionSignature {
  readonly payloadMode: 'none';
  readonly parameterDeclaration: '';
  readonly callArgumentsExpression: '';
  readonly hasPayload: false;
  readonly isOptional: true;
}

export interface RequiredPayloadExecutionSignature extends BaseRouteExecutionSignature {
  readonly payloadMode: 'required';
  readonly parameterDeclaration: string;
  readonly callArgumentsExpression: 'payload';
  readonly hasPayload: true;
  readonly isOptional: false;
}

export interface OptionalPayloadExecutionSignature extends BaseRouteExecutionSignature {
  readonly payloadMode: 'optional';
  readonly parameterDeclaration: string;
  readonly callArgumentsExpression: 'payload';
  readonly hasPayload: true;
  readonly isOptional: true;
}

export type AnyRouteExecutionSignature =
  | NoPayloadExecutionSignature
  | RequiredPayloadExecutionSignature
  | OptionalPayloadExecutionSignature;

export interface RouteExecutionSignature extends BaseRouteExecutionSignature {}

export interface RoutePayloadModeSpecification<M extends RoutePayloadMode = RoutePayloadMode> {
  readonly mode: M;
  readonly hasPayload: boolean;
  readonly isOptional: boolean;
  readonly defaultCallArguments: string;
  readonly formatDeclaration: (typeName: string) => string;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key RoutePayloadMode.
 */
export type RoutePayloadModeRegistry = {
  readonly [M in RoutePayloadMode]: RoutePayloadModeSpecification<M>;
};

export const ROUTE_PAYLOAD_MODE_REGISTRY: RoutePayloadModeRegistry = Object.freeze({
  [RoutePayloadMode.None]: {
    mode: RoutePayloadMode.None,
    hasPayload: false,
    isOptional: true,
    defaultCallArguments: '',
    formatDeclaration: () => ''
  },
  [RoutePayloadMode.Required]: {
    mode: RoutePayloadMode.Required,
    hasPayload: true,
    isOptional: false,
    defaultCallArguments: 'payload',
    formatDeclaration: (typeName: string) => `payload: ${typeName}`
  },
  [RoutePayloadMode.Optional]: {
    mode: RoutePayloadMode.Optional,
    hasPayload: true,
    isOptional: true,
    defaultCallArguments: 'payload',
    formatDeclaration: (typeName: string) => `payload: ${typeName} = {}`
  }
});

export interface RouteExecutionSignatureVisitor<R> {
  readonly none: (sig: NoPayloadExecutionSignature) => R;
  readonly required: (sig: RequiredPayloadExecutionSignature) => R;
  readonly optional: (sig: OptionalPayloadExecutionSignature) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian RouteExecutionSignature dengan exhaustive type safety
 */
export function matchRouteExecutionSignature<R>(
  signature: RouteExecutionSignature | RoutePayloadMode,
  visitor: RouteExecutionSignatureVisitor<R>
): R {
  const mode = typeof signature === 'string' ? signature : signature.payloadMode;
  return visitor[mode](signature as any);
}

export const matchRoutePayloadMode = matchRouteExecutionSignature;

export class ScannedRouteExecutionSignature implements RouteExecutionSignature {
  public readonly payloadMode: RoutePayloadMode;
  public readonly parameterDeclaration: string;
  public readonly callArgumentsExpression: string;
  public readonly hasPayload: boolean;
  public readonly isOptional: boolean;

  constructor({
    payloadMode,
    parameterDeclaration,
    callArgumentsExpression,
    hasPayload,
    isOptional
  }: {
    readonly payloadMode: RoutePayloadMode;
    readonly parameterDeclaration: string;
    readonly callArgumentsExpression: string;
    readonly hasPayload?: boolean;
    readonly isOptional?: boolean;
  }) {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[payloadMode];
    this.payloadMode = payloadMode;
    this.parameterDeclaration = parameterDeclaration;
    this.callArgumentsExpression = callArgumentsExpression;
    this.hasPayload = hasPayload ?? spec.hasPayload;
    this.isOptional = isOptional ?? spec.isOptional;
    Object.freeze(this);
  }

  public static noPayload(): NoPayloadExecutionSignature {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.None];
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.None,
      parameterDeclaration: spec.formatDeclaration(''),
      callArgumentsExpression: spec.defaultCallArguments,
      hasPayload: spec.hasPayload,
      isOptional: spec.isOptional
    }) as NoPayloadExecutionSignature;
  }

  public static authOnly(): NoPayloadExecutionSignature {
    return ScannedRouteExecutionSignature.noPayload();
  }

  public static requiredPayload(typeName: string): RequiredPayloadExecutionSignature {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.Required];
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.Required,
      parameterDeclaration: spec.formatDeclaration(typeName),
      callArgumentsExpression: spec.defaultCallArguments,
      hasPayload: spec.hasPayload,
      isOptional: spec.isOptional
    }) as RequiredPayloadExecutionSignature;
  }

  public static optionalPayload(typeName: string): OptionalPayloadExecutionSignature {
    const spec = ROUTE_PAYLOAD_MODE_REGISTRY[RoutePayloadMode.Optional];
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.Optional,
      parameterDeclaration: spec.formatDeclaration(typeName),
      callArgumentsExpression: spec.defaultCallArguments,
      hasPayload: spec.hasPayload,
      isOptional: spec.isOptional
    }) as OptionalPayloadExecutionSignature;
  }

  public static fromMode(mode: RoutePayloadMode, typeName: string = 'any'): RouteExecutionSignature {
    const DISPATCH: Record<RoutePayloadMode, () => RouteExecutionSignature> = {
      [RoutePayloadMode.None]: () => ScannedRouteExecutionSignature.noPayload(),
      [RoutePayloadMode.Required]: () => ScannedRouteExecutionSignature.requiredPayload(typeName),
      [RoutePayloadMode.Optional]: () => ScannedRouteExecutionSignature.optionalPayload(typeName)
    };
    return DISPATCH[mode]();
  }

  public static create(
    hookKind: RouteHookKind,
    hasParams: boolean,
    hasPayload: boolean = false,
    typeName: string = 'any'
  ): RouteExecutionSignature {
    const mode = hasPayload ? RoutePayloadMode.Required : RoutePayloadMode.None;
    return ScannedRouteExecutionSignature.fromMode(mode, typeName);
  }
}
