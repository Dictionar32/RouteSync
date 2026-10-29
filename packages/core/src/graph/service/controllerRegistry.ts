import type { ControllerNode } from '../../types/semantic';
import { createControllerNodeName } from '../../types/semantic/nominalVocabulary';
import { graphNodeFactoryOperations } from './nodeFactories';
import type { ControllerAction } from '../../types/semantic/serviceGraphTypes';

/** A graph-owned controller fact. This is deliberately not a reusable relation index. */
export interface ControllerRegistryEntry {
  readonly name: string;
  readonly controller: ControllerNode;
}

export type ControllerLookup =
  | { readonly kind: 'missing' }
  | { readonly kind: 'found'; readonly value: ControllerNode };

export interface ControllerRegistry {
  readonly entries: readonly ControllerRegistryEntry[];
  readonly lookup: (name: string) => ControllerLookup;
  readonly register: (name: string, controller: ControllerNode) => ControllerRegistry;
  readonly registerAction: (name: string, action: ControllerAction) => ControllerRegistry;
}

export interface ControllerRegistryOperationsInterface {
  readonly empty: () => ControllerRegistry;
  readonly fromEntries: (entries: readonly ControllerRegistryEntry[]) => ControllerRegistry;
}

const lookupController = (
  entries: readonly ControllerRegistryEntry[],
  name: string,
): ControllerLookup => {
  const found = entries.find(entry => entry.name === name);
  return found === undefined ? { kind: 'missing' } : { kind: 'found', value: found.controller };
};

const createRegistry = (initial: readonly ControllerRegistryEntry[]): ControllerRegistry => {
  const entries = Object.freeze([...initial]);
  const register = (name: string, controller: ControllerNode): ControllerRegistry =>
    createRegistry([
      ...entries.filter(entry => entry.name !== name),
      Object.freeze({ name, controller }),
    ]);
  const registerAction = (name: string, action: ControllerAction): ControllerRegistry => {
    const current = lookupController(entries, name);
    const controller = current.kind === 'found'
      ? current.value
      : graphNodeFactoryOperations.buildControllerNode(createControllerNodeName(name), [action.name]);
    const actions = controller.actions.some(candidate => candidate.name.value.value === action.name.value.value)
      ? controller.actions
      : Object.freeze([...controller.actions, action]);
    return register(name, Object.freeze({ ...controller, actions }));
  };
  return Object.freeze({
    entries,
    lookup: (name: string) => lookupController(entries, name),
    register,
    registerAction,
  });
};

export const controllerRegistryOperations: ControllerRegistryOperationsInterface = Object.freeze({
  empty: () => createRegistry([]),
  fromEntries: (entries: readonly ControllerRegistryEntry[]) => createRegistry(entries),
});
