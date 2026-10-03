import { PrimitiveKind, PrimitiveType, primitiveType } from '../compiler/types/SemanticType';
import type { ModelName } from '../types/domain/semanticValues';
import type { BoundCardinality } from '../types/domain/boundAst';
import type { SemanticType } from '../types/semantic';
import { SemanticValueFactory } from '../types/domain/semanticValues';
import { relationResolve, relationFirst, relationOptionMap, relationProject, type RelationOption } from './kernel/relationalSequence';
import { relationIsSome } from './kernel/semanticRelations';

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
  | { readonly kind: 'object'; readonly fields: readonly { readonly name: string; readonly type: SemanticType }[] };

export type FrameworkMethodRule = {
  readonly returns: FrameworkReturnDescriptor;
  readonly confidence: number;
};

const scalar = (semanticType: SemanticType): FrameworkMethodRule =>
  Object.freeze({ returns: Object.freeze({ kind: 'scalar', semanticType }), confidence: 100 });

const model = (name: string, confidence = 100): FrameworkMethodRule =>
  Object.freeze({
    returns: Object.freeze({
      kind: 'model',
      model: SemanticValueFactory.modelName(name),
      cardinality: { kind: 'single' },
    }),
    confidence,
  });

const object = (fields: readonly { readonly name: string; readonly type: SemanticType }[] = []): FrameworkMethodRule =>
  Object.freeze({ returns: Object.freeze({ kind: 'object', fields: Object.freeze([...fields]) }), confidence: 100 });

const entry = <T>(name: string, value: T): readonly [string, T] => [name, value];
type Registry<T> = readonly (readonly [string, T])[];

export const GLOBAL_FUNCTIONS: Registry<FrameworkMethodRule> = Object.freeze([
  ...relationProject(['strtoupper', 'strtolower', 'ucfirst', 'ucwords', 'asset', 'url', 'route', 'ltrim', 'trim', 'strval', 'now'], name => entry(name, scalar(primitiveType(PrimitiveKind.STRING)))),
  ...relationProject(['intval', 'floatval', 'doubleval', 'count'], name => entry(name, scalar(primitiveType(PrimitiveKind.NUMBER)))),
  entry('boolval', scalar(primitiveType(PrimitiveKind.BOOLEAN))),
]);

const CARBON_DATE_METHODS: readonly string[] = [
  'toDateTimeString', 'toISOString', 'toIso8601String', 'format',
  'diffForHumans', 'toDateString', 'toDateTime',
];

/** Method-name-only registry. Dynamic lookup remains confined to this boundary. */
export const METHOD_REGISTRY: Registry<FrameworkMethodRule> = Object.freeze([
  ['validated', object()],
  ['safe', object()],
  ['createToken', object([{ name: 'plainTextToken', type: primitiveType(PrimitiveKind.STRING) }])],
  ...relationProject(CARBON_DATE_METHODS, name => entry(name, scalar(primitiveType(PrimitiveKind.STRING)))),
]);

/** Variable helper lookup is also confined to the registry boundary. */
export const VARIABLE_METHOD_REGISTRY: Registry<Registry<FrameworkMethodRule>> = Object.freeze([
  ['request', Object.freeze([['user', model('User', 90)] as const])],
  ['pdf', Object.freeze([['download', scalar(primitiveType(PrimitiveKind.FILE))] as const])],
]);

const lookup = <T>(source: Registry<T>, key: string): RelationOption<T> => relationOptionMap(relationFirst(source, ([candidate]) => Object.is(candidate, key)), pair => pair[1]);

export function lookupGlobalFunction(name: string): RelationOption<FrameworkMethodRule> {
  return lookup(GLOBAL_FUNCTIONS, name);
}

export function lookupMethod(name: string): RelationOption<FrameworkMethodRule> {
  return lookup(METHOD_REGISTRY, name);
}

export function lookupVariableMethod(variableName: string, methodName: string): RelationOption<FrameworkMethodRule> {
  const methods = lookup(VARIABLE_METHOD_REGISTRY, variableName);
  return relationResolve(relationIsSome(methods), () => lookup(methods.value, methodName), () => ({ kind: 'none' }));
}
