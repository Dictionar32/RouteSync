import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteBindingFact } from '../../../../types/upstream/routeBindingFacts';
import { createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import { fromBooleanFlag, fromOptional, mapOptional, type Presence } from '../../../../types/upstream/presence';
export type { RouteBindingFact } from '../../../../types/upstream/routeBindingFacts';

function extractParentParameters(path: string | undefined): ReadonlyMap<string, string> {
  const relation = new Map<string, string>();
  const pathPresence = fromOptional(path);
  const handlers = Object.freeze({
    absent: () => relation,
    present: (value: Extract<typeof pathPresence, { kind: 'present' }>) => {
      let parent: Presence<string> = { kind: 'absent' };
      for (const segment of value.value.split('/')) {
        const matchPresence = fromOptional(/^\{(?<parameter>[A-Za-z_][A-Za-z0-9_]*)(?::[^}]+)?\}$/.exec(segment));
        const matchHandlers = Object.freeze({
          absent: () => relation,
          present: (matchValue: Extract<typeof matchPresence, { kind: 'present' }>) => {
            const parameterPresence = fromOptional(matchValue.value.groups?.parameter);
            const parameter = Object.freeze({
              absent: () => '',
              present: (value: Extract<typeof parameterPresence, { kind: 'present' }>) => value.value,
            })[parameterPresence.kind](parameterPresence as never);
            const parentHandlers = Object.freeze({
              absent: () => relation,
              present: (input: Extract<typeof parent, { kind: 'present' }>) => relation.set(parameter, input.value),
            });
            parentHandlers[parent.kind](parent as never);
            parent = { kind: 'present', value: parameter };
            return relation;
          },
        });
        matchHandlers[matchPresence.kind](matchPresence as never);
      }
      return relation;
    },
  });
  return handlers[pathPresence.kind](pathPresence as never);
}

function parentPresence(parameter: string, relations: ReadonlyMap<string, string>): Presence<import('../../../../types/upstream/names').RouteParameterName> {
  const parent = relations.get(parameter);
  const presence = fromOptional(parent);
  const handlers = Object.freeze({
    absent: () => ({ kind: 'absent' as const }),
    present: (value: Extract<typeof presence, { kind: 'present' }>) => ({
      kind: 'present' as const,
      value: createRouteParameterName(value.value),
    }),
  });
  return handlers[presence.kind](presence as never);
}

/** AAT -> typed syntax facts. No Laravel binding inference occurs here. */
export function extractRouteBindingFactsFromAst(declaration: RouteDeclarationAst): readonly RouteBindingFact[] {
  const parents = extractParentParameters(declaration.path);
  const withTrashed: RouteBindingFact['withTrashed'] = fromBooleanFlag(declaration.withTrashed);
  return Object.freeze(declaration.bindings.map(binding => Object.freeze({
    parameter: createRouteParameterName(binding.parameter),
    parent: parentPresence(binding.parameter, parents),
    customKey: mapOptional(binding.customKey, stringValue),
    withTrashed,
  })));
}
