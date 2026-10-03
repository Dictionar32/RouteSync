import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteBindingFact } from '../../../../types/upstream/routeBindingFacts';
import { createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { mapOptional, type Presence } from '../../../../types/upstream/presence';
export type { RouteBindingFact } from '../../../../types/upstream/routeBindingFacts';

function extractParentParameters(path: string | undefined): ReadonlyMap<string, string> {
  const relation = new Map<string, string>();
  if (path === undefined) return relation;
  let parent: string | undefined;
  for (const segment of path.split('/')) {
    const match = /^\{([A-Za-z_][A-Za-z0-9_]*)(?::[^}]+)?\}$/.exec(segment);
    if (!match) continue;
    const parameter = match[1];
    if (parent !== undefined) relation.set(parameter, parent);
    parent = parameter;
  }
  return relation;
}

function parentPresence(parameter: string, relations: ReadonlyMap<string, string>): Presence<import('../../../../types/upstream/names').RouteParameterName> {
  const parent = relations.get(parameter);
  return parent === undefined
    ? { kind: 'absent' }
    : { kind: 'present', value: createRouteParameterName(parent) };
}

/** AAT -> typed syntax facts. No Laravel binding inference occurs here. */
export function extractRouteBindingFactsFromAst(declaration: RouteDeclarationAst): readonly RouteBindingFact[] {
  const parents = extractParentParameters(declaration.path);
  const withTrashed: RouteBindingFact['withTrashed'] = declaration.withTrashed ? { kind: 'present' } : { kind: 'absent' };
  return Object.freeze(declaration.bindings.map(binding => Object.freeze({
    parameter: createRouteParameterName(binding.parameter),
    parent: parentPresence(binding.parameter, parents),
    customKey: mapOptional(binding.customKey, stringValue),
    withTrashed,
  })));
}
