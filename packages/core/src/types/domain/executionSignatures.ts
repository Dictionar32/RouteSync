import { RoutePayloadMode } from '../upstream/routeExecutionVocabulary';
import type { RouteExecutionSignature, NoPayloadExecutionSignature, RequiredPayloadExecutionSignature, OptionalPayloadExecutionSignature, RouteHookKind } from '../upstream/routeExecutionVocabulary';
export { RoutePayloadMode } from '../upstream/routeExecutionVocabulary';
export type { RouteExecutionSignature, NoPayloadExecutionSignature, RequiredPayloadExecutionSignature, OptionalPayloadExecutionSignature } from '../upstream/routeExecutionVocabulary';
export interface RoutePayloadModeSpecification<M extends RoutePayloadMode = RoutePayloadMode> {
  readonly mode: M;
  readonly hasPayload: NoPayloadExecutionSignature['hasPayload'] | RequiredPayloadExecutionSignature['hasPayload'];
  readonly isOptional: NoPayloadExecutionSignature['isOptional'] | RequiredPayloadExecutionSignature['isOptional'];
  readonly defaultCallArguments: '' | 'payload';
  readonly formatDeclaration: (typeName: string) => string;
}

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

export function matchRouteExecutionSignature<R>(
  signature: RouteExecutionSignature,
  visitor: RouteExecutionSignatureVisitor<R>
): R {
  switch (signature.payloadMode) {
    case RoutePayloadMode.None:
      return visitor.none(signature);
    case RoutePayloadMode.Required:
      return visitor.required(signature);
    case RoutePayloadMode.Optional:
      return visitor.optional(signature);
  }
}

export const matchRoutePayloadMode = matchRouteExecutionSignature;

export class ScannedRouteExecutionSignature {
  private constructor() {}

  public static noPayload(): NoPayloadExecutionSignature {
    return Object.freeze({
      payloadMode: RoutePayloadMode.None,
      parameterDeclaration: '',
      callArgumentsExpression: '',
      hasPayload: false,
      isOptional: true
    });
  }

  public static authOnly(): NoPayloadExecutionSignature {
    return ScannedRouteExecutionSignature.noPayload();
  }

  public static requiredPayload(typeName: string): RequiredPayloadExecutionSignature {
    return Object.freeze({
      payloadMode: RoutePayloadMode.Required,
      parameterDeclaration: `payload: ${typeName}`,
      callArgumentsExpression: 'payload',
      hasPayload: true,
      isOptional: false
    });
  }

  public static optionalPayload(typeName: string): OptionalPayloadExecutionSignature {
    return Object.freeze({
      payloadMode: RoutePayloadMode.Optional,
      parameterDeclaration: `payload: ${typeName} = {}`,
      callArgumentsExpression: 'payload',
      hasPayload: true,
      isOptional: true
    });
  }

  public static fromMode(
    mode: RoutePayloadMode,
    typeName?: string
  ): RouteExecutionSignature {
    switch (mode) {
      case RoutePayloadMode.None:
        return ScannedRouteExecutionSignature.noPayload();
      case RoutePayloadMode.Required:
        if (typeName === undefined) {
          throw new Error('Required payload execution signature requires a payload type.');
        }
        return ScannedRouteExecutionSignature.requiredPayload(typeName);
      case RoutePayloadMode.Optional:
        if (typeName === undefined) {
          throw new Error('Optional payload execution signature requires a payload type.');
        }
        return ScannedRouteExecutionSignature.optionalPayload(typeName);
    }
  }

  public static create(
    _hookKind: RouteHookKind,
    _hasParams: boolean,
    hasPayload = false,
    typeName?: string
  ): RouteExecutionSignature {
    return ScannedRouteExecutionSignature.fromMode(
      hasPayload ? RoutePayloadMode.Required : RoutePayloadMode.None,
      typeName
    );
  }
}
