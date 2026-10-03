import { RoutePayloadMode } from '../upstream/routeExecutionVocabulary';
import { absent, presenceFold, type Presence } from '../upstream/presence';
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
  const visitors: Readonly<Record<RoutePayloadMode, (sig: RouteExecutionSignature) => R>> = {
    [RoutePayloadMode.None]: sig => visitor.none(sig as NoPayloadExecutionSignature),
    [RoutePayloadMode.Required]: sig => visitor.required(sig as RequiredPayloadExecutionSignature),
    [RoutePayloadMode.Optional]: sig => visitor.optional(sig as OptionalPayloadExecutionSignature),
  };
  return visitors[signature.payloadMode](signature);
}

export const matchRoutePayloadMode = matchRouteExecutionSignature;

export interface RouteSemanticFlowExecutionSignatureFactory {
  readonly noPayload: () => NoPayloadExecutionSignature;
  readonly authOnly: () => NoPayloadExecutionSignature;
  readonly requiredPayload: (typeName: string) => RequiredPayloadExecutionSignature;
  readonly optionalPayload: (typeName: string) => OptionalPayloadExecutionSignature;
  readonly fromMode: (mode: RoutePayloadMode, typeName?: Presence<string>) => RouteExecutionSignature;
  readonly create: (hookKind: RouteHookKind, hasParams: boolean, hasPayload?: boolean, typeName?: Presence<string>) => RouteExecutionSignature;
}

export const RouteSemanticFlowExecutionSignature: RouteSemanticFlowExecutionSignatureFactory = Object.freeze({
  noPayload: (): NoPayloadExecutionSignature => Object.freeze({
    payloadMode: RoutePayloadMode.None,
    parameterDeclaration: '',
    callArgumentsExpression: '',
    hasPayload: false,
    isOptional: true
  }),

  authOnly: (): NoPayloadExecutionSignature => RouteSemanticFlowExecutionSignature.noPayload(),

  requiredPayload: (typeName: string): RequiredPayloadExecutionSignature => Object.freeze({
    payloadMode: RoutePayloadMode.Required,
    parameterDeclaration: `payload: ${typeName}`,
    callArgumentsExpression: 'payload',
    hasPayload: true,
    isOptional: false
  }),

  optionalPayload: (typeName: string): OptionalPayloadExecutionSignature => Object.freeze({
    payloadMode: RoutePayloadMode.Optional,
    parameterDeclaration: `payload: ${typeName} = {}`,
    callArgumentsExpression: 'payload',
    hasPayload: true,
    isOptional: true
  }),

  fromMode: (
    mode: RoutePayloadMode,
    typeName: Presence<string> = absent(),
  ): RouteExecutionSignature => {
    const builders: Readonly<Record<RoutePayloadMode, (name: Presence<string>) => RouteExecutionSignature>> = {
      [RoutePayloadMode.None]: () => RouteSemanticFlowExecutionSignature.noPayload(),
      [RoutePayloadMode.Required]: name => presenceFold(
        name,
        () => { throw Error('Required payload execution signature requires a payload type.'); },
        value => RouteSemanticFlowExecutionSignature.requiredPayload(value),
      ),
      [RoutePayloadMode.Optional]: name => presenceFold(
        name,
        () => { throw Error('Optional payload execution signature requires a payload type.'); },
        value => RouteSemanticFlowExecutionSignature.optionalPayload(value),
      ),
    };
    return builders[mode](typeName);
  },

  create: (
    _hookKind: RouteHookKind,
    _hasParams: boolean,
    hasPayload = false,
    typeName: Presence<string> = absent(),
  ): RouteExecutionSignature => {
    const mode = ({ true: RoutePayloadMode.Required, false: RoutePayloadMode.None } as const)[String(hasPayload) as 'true' | 'false'];
    return RouteSemanticFlowExecutionSignature.fromMode(mode, typeName);
  },
});
