/** Declarative graph analyses over the dependency relation. */
import type { DependencyGraph } from './dependencyGraph';
import { dependencyClosure, dependencyNodes, dependencyForward, dependencyReverse } from './dependencyGraph';
import { relationFixedPoint, relationProject, relationExpand, relationSelect, relationUnique, relationAll, relationEqual } from '../../../semantic/kernel/relationalSequence';
import { createUnionFind, unionFindUnion, type UnionFind } from '../../constraints/UnionFind';

export const invalidateDependencies = (graph: DependencyGraph, node: string): readonly string[] => dependencyClosure(graph, [node]);

const reach = (graph: DependencyGraph, start: string, direction: 'forward' | 'reverse'): readonly string[] => {
  const next = Object.freeze({ forward: dependencyForward, reverse: dependencyReverse })[direction];
  const step = (current: readonly string[]): readonly string[] => relationUnique([...current, ...relationExpand(current, value => next(graph, value))]);
  const stable = (left: readonly string[], right: readonly string[]): boolean => relationAll([relationEqual(left.length, right.length), relationAll(relationProject(left, (value, index) => relationEqual(value, right[index])))]);
  return relationFixedPoint(Object.freeze([start]), step, stable).value;
};

export const stronglyConnectedComponents = (graph: DependencyGraph): readonly (readonly string[])[] => {
  const nodes = dependencyNodes(graph);
  return relationUnique(relationProject(nodes, node => Object.freeze(relationUnique(relationSelect(nodes, candidate => relationAll([reach(graph, node, 'forward').includes(candidate), reach(graph, candidate, 'forward').includes(node)]))))));
};

export type GraphUnionFind = UnionFind;

export const createGraphUnionFind = (): GraphUnionFind => createUnionFind();
export const graphUnionFindUnion = (state: GraphUnionFind, left: number, right: number): GraphUnionFind => unionFindUnion(state, left, right);
