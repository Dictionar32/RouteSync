/** Declarative graph analyses over the dependency relation. */
import type { DependencyGraph } from './dependencyGraph';
import { dependencyClosure, dependencyNodes, dependencyForward, dependencyReverse } from './dependencyGraph';
import { relationFixedPoint, relationProject, relationSelect, relationUnique, relationAll, relationAny, relationEqual, expandRelation } from '../../../semantic/kernel/relationalSequence';

export const invalidateDependencies = (graph: DependencyGraph, node: string): readonly string[] => dependencyClosure(graph, [node]);

const reach = (graph: DependencyGraph, start: string, direction: 'forward' | 'reverse'): readonly string[] => {
  const next = Object.freeze({ forward: dependencyForward, reverse: dependencyReverse })[direction];
  const step = (current: readonly string[]): readonly string[] => relationUnique([...current, ...relationProject(relationProject(current, value => next(graph, value)), item => item)]);
  const stable = (left: readonly string[], right: readonly string[]): boolean => relationAll([relationEqual(left.length, right.length), relationAll(relationProject(left, (value, index) => relationEqual(value, right[index])))]);
  return relationFixedPoint(Object.freeze([start]), step, stable).value;
};

export const stronglyConnectedComponents = (graph: DependencyGraph): readonly (readonly string[])[] => {
  const nodes = dependencyNodes(graph);
  return relationUnique(relationProject(nodes, node => Object.freeze(relationUnique(relationSelect(nodes, candidate => relationAll([reach(graph, node, 'forward').includes(candidate), reach(graph, candidate, 'forward').includes(node)]))))));
};

export interface GraphUnionFind {
  readonly groups: readonly (readonly number[])[];
}

export const createGraphUnionFind = (): GraphUnionFind => Object.freeze({ groups: Object.freeze([]) });
export const graphUnionFindUnion = (state: GraphUnionFind, left: number, right: number): GraphUnionFind => {
  const merged = Object.freeze([left, right]);
  const touching = relationSelect(state.groups, group => relationAny([group.includes(left), group.includes(right)]));
  const retained = relationSelect(state.groups, group => relationAll([!group.includes(left), !group.includes(right)]));
  const combined = relationUnique([left, right, ...expandRelation(touching)]);
  return Object.freeze({ groups: Object.freeze([...retained, Object.freeze(combined)]) });
};
