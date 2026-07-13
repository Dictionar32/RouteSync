import { SemanticType } from '../types/semantic'

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

export interface FrameworkMethodRule {
  returns: SemanticType | 'model'
  /** Only meaningful when returns === 'model'. */
  model?: string
  collection?: boolean
  paginated?: boolean
  /** For synthetic object results — see SemanticResolution.fields. */
  fields?: Record<string, string>
  confidence?: number
}

export const GLOBAL_FUNCTIONS: Record<string, FrameworkMethodRule> = {
  strtoupper: { returns: 'string' },
  strtolower: { returns: 'string' },
  ucfirst: { returns: 'string' },
  ucwords: { returns: 'string' },
  asset: { returns: 'string' },
  url: { returns: 'string' },
  route: { returns: 'string' },
  ltrim: { returns: 'string' },
  trim: { returns: 'string' },
  strval: { returns: 'string' },
  now: { returns: 'string' },
  intval: { returns: 'number' },
  floatval: { returns: 'number' },
  doubleval: { returns: 'number' },
  count: { returns: 'number' },
  boolval: { returns: 'boolean' },
}

const CARBON_DATE_METHODS = ['toDateTimeString', 'toISOString', 'toIso8601String', 'format', 'diffForHumans', 'toDateString', 'toDateTime']

/** Method-name-only registry — see file header for why there's no `owner` yet. */
export const METHOD_REGISTRY: Record<string, FrameworkMethodRule> = {
  validated: { returns: 'object' },
  safe: { returns: 'object' },
  createToken: { returns: 'object', fields: { plainTextToken: 'string' } },
  ...Object.fromEntries(CARBON_DATE_METHODS.map(m => [m, { returns: 'string' as const }])),
}

/** (variable name -> method name -> rule) for helpers keyed on a conventional variable, not a resolvable class. */
export const VARIABLE_METHOD_REGISTRY: Record<string, Record<string, FrameworkMethodRule>> = {
  request: {
    user: { returns: 'model', model: 'User', confidence: 90 },
  },
  pdf: {
    download: { returns: 'BinaryFile', confidence: 80 },
  },
}

export function lookupGlobalFunction(name: string): FrameworkMethodRule | undefined {
  return GLOBAL_FUNCTIONS[name]
}

export function lookupMethod(name: string): FrameworkMethodRule | undefined {
  return METHOD_REGISTRY[name]
}

export function lookupVariableMethod(variableName: string, methodName: string): FrameworkMethodRule | undefined {
  return VARIABLE_METHOD_REGISTRY[variableName]?.[methodName]
}
