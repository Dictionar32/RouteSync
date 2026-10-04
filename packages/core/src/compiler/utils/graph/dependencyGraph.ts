/** Canonical immutable dependency relation. */
import { relationFixedPoint, relationProject, relationExpand, relationSelect, relationUnique, relationAll, relationEqual } from '../../../semantic/kernel/relationalSequence';

export type DependencyEdge = readonly [string, string];
export interface DependencyGraph {
  readonly edges: readonly DependencyEdge[];
}

export const createDependencyGraph = (edges: readonly DependencyEdge[] = []): DependencyGraph => Object.freeze({ edges: Object.freeze(relationUnique(edges)) });
export const addDependency = (graph: DependencyGraph, from: string, to: string): DependencyGraph => createDependencyGraph([...graph.edges, [from, to]]);
export const dependencyForward = (graph: DependencyGraph, node: string): readonly string[] => relationUnique(relationProject(relationSelect(graph.edges, edge => relationEqual(edge[0], node)), edge => edge[1]));
export const dependencyReverse = (graph: DependencyGraph, node: string): readonly string[] => relationUnique(relationProject(relationSelect(graph.edges, edge => relationEqual(edge[1], node)), edge => edge[0]));
export const dependencyNodes = (graph: DependencyGraph): readonly string[] => relationUnique(relationProject(graph.edges, edge => edge[0]).concat(relationProject(graph.edges, edge => edge[1])));

export const dependencyClosure = (graph: DependencyGraph, seed: readonly string[]): readonly string[] => {
  const step = (current: readonly string[]): readonly string[] => relationUnique([...current, ...relationExpand(current, node => dependencyForward(graph, node))]);
  return relationFixedPoint(Object.freeze(relationUnique(seed)), step, (left, right) => relationAll([relationEqual(left.length, right.length), relationAll(relationProject(left, (value, index) => relationEqual(value, right[index])))])).value;
};
