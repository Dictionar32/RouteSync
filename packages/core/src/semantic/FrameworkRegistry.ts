import { PrimitiveKind, PrimitiveType } from '../types/semantic';
import type { ModelName } from '../types/domain/semanticValues';
import type { BoundCardinality } from '../types/domain/boundAst';
import type { SemanticType } from '../types/semantic';
import { SemanticValueFactory } from '../types/domain/semanticValues';

/**
 * Roadmap: FrameworkRegistry (see design review thread — FrameworkRegistryResolver
 * was "half registry, half if-chain"). This is the "all registry" version.
 *
 * Two lookup tables, not one, because the two real cases in this codebase
 * key off genuinely different things:
 *
 *   - METHOD_REGISTRY: matched by method name alone. This is honest about
 *     what the resolver can actually know today — e.g. `->format()` on a
 *     Carbon date almost never has an explicit `Carbon` class reference in
 *     the AST (it's usually `$this->created_at->format(...)`, where
 *     `created_at` resolved to a date type via a column cast, not via a
 *     class name) — so there's no `owner` to key on yet. A real
 *     `owner`-scoped registry (`{owner:'Carbon', method:'format'}`) is the
 *     natural next step once there's a type system that tracks receiver
 *     class, not just receiver semantic type.
 *
 *   - VARIABLE_METHOD_REGISTRY: matched by (variable name, method name).
 *     `request->user()` and `pdf->download()` don't key off a resolvable
 *     class at all — 'request' and 'pdf' are conventional variable names,
 *     not models. These used to be duplicated as string-comparison special
 *     cases in MethodReturnResolver AND FrameworkRegistryResolver
 *     (createToken lived in both, with two different return shapes —
 *     whichever plugin ran first silently won). One entry, one place now.
 */

export * from './frameworkRules';

export type FrameworkReturnDescriptor =
  | { readonly kind: 'scalar'; readonly semanticType: SemanticType }
  | { readonly kind: 'model'; readonly model: ModelName; readonly cardinality: BoundCardinality }
  | { readonly kind: 'object'; readonly fields: readonly (readonly [string, SemanticType])[] };

export type FrameworkMethodRule = {
  readonly returns: FrameworkReturnDescriptor;
  readonly confidence: number;
};

const scalar = (semanticType: SemanticType): FrameworkMethodRule =>
  Object.freeze({ returns: Object.freeze({ kind: 'scalar' as const, semanticType }), confidence: 100 });

const model = (name: string, confidence = 100): FrameworkMethodRule =>
  Object.freeze({
    returns: Object.freeze({
      kind: 'model' as const,
      model: SemanticValueFactory.modelName(name),
      cardinality: { kind: 'single' } as const,
    }),
    confidence,
  });

const object = (fields: readonly (readonly [string, SemanticType])[] = []): FrameworkMethodRule =>
  Object.freeze({ returns: Object.freeze({ kind: 'object' as const, fields: Object.freeze([...fields]) }), confidence: 100 });

export const GLOBAL_FUNCTIONS: ReadonlyMap<string, FrameworkMethodRule> = new Map([
  ...['strtoupper', 'strtolower', 'ucfirst', 'ucwords', 'asset', 'url', 'route', 'ltrim', 'trim', 'strval', 'now']
    .map(name => [name, scalar(new PrimitiveType(PrimitiveKind.STRING))] as const),
  ...['intval', 'floatval', 'doubleval', 'count']
    .map(name => [name, scalar(new PrimitiveType(PrimitiveKind.NUMBER))] as const),
  ['boolval', scalar(new PrimitiveType(PrimitiveKind.BOOLEAN))],
]);

const CARBON_DATE_METHODS = [
  'toDateTimeString', 'toISOString', 'toIso8601String', 'format',
  'diffForHumans', 'toDateString', 'toDateTime',
] as const;

/** Method-name-only registry. Dynamic lookup remains confined to this boundary. */
export const METHOD_REGISTRY: ReadonlyMap<string, FrameworkMethodRule> = new Map([
  ['validated', object()],
  ['safe', object()],
  ['createToken', object([['plainTextToken', new PrimitiveType(PrimitiveKind.STRING)]])],
  ...CARBON_DATE_METHODS.map(name => [name, scalar(new PrimitiveType(PrimitiveKind.STRING))] as const),
]);

/** Variable helper lookup is also confined to the registry boundary. */
export const VARIABLE_METHOD_REGISTRY: ReadonlyMap<string, ReadonlyMap<string, FrameworkMethodRule>> = new Map([
  ['request', new Map([['user', model('User', 90)]])],
  ['pdf', new Map([['download', scalar(new PrimitiveType(PrimitiveKind.FILE))]])],
]);

export function lookupGlobalFunction(name: string): FrameworkMethodRule | undefined {
  return GLOBAL_FUNCTIONS.get(name)
}

export function lookupMethod(name: string): FrameworkMethodRule | undefined {
  return METHOD_REGISTRY.get(name)
}

export function lookupVariableMethod(variableName: string, methodName: string): FrameworkMethodRule | undefined {
  const methods = VARIABLE_METHOD_REGISTRY.get(variableName)
  return methods === undefined ? undefined : methods.get(methodName)
}
