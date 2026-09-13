/**
 * dependencyGraph.ts
 *
 * DependencyGraph data structure and builder.
 *
 * @module core/compiler/utils/graph
 */

import { FrozenSet } from './frozenSet';

export interface DependencyGraph {
  readonly forward: ReadonlyMap<string, ReadonlySet<string>>;
  readonly reverse: ReadonlyMap<string, ReadonlySet<string>>;
}

export class DependencyGraphBuilder {
  private readonly forward = new Map<string, Set<string>>();
  private readonly reverse = new Map<string, Set<string>>();

  public addDependency(from: string, to: string): this {
    const forwardDeps = this.forward.get(from) || new Set();
    forwardDeps.add(to);
    this.forward.set(from, forwardDeps);

    const reverseDeps = this.reverse.get(to) || new Set();
    reverseDeps.add(from);
    this.reverse.set(to, reverseDeps);
    return this;
  }

  public build(): DependencyGraph {
    const finalForward = new Map<string, FrozenSet<string>>();
    for (const [k, v] of this.forward.entries()) finalForward.set(k, new FrozenSet(v));

    const finalReverse = new Map<string, FrozenSet<string>>();
    for (const [k, v] of this.reverse.entries()) finalReverse.set(k, new FrozenSet(v));

    const result = { forward: finalForward, reverse: finalReverse };
    Object.freeze(result);
    return result;
  }
}
