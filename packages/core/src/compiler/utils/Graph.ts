/**
 * Graph and graph algorithm utilities
 */

export interface DependencyGraph {
    readonly forward: ReadonlyMap<string, ReadonlySet<string>>;
    readonly reverse: ReadonlyMap<string, ReadonlySet<string>>;
}

export class FrozenSet<T> implements ReadonlySet<T> {
  #data: Set<T>;

  constructor(source: ReadonlySet<T>) {
    this.#data = new Set(source);
    Object.freeze(this);
  }

  public has(v: T): boolean {
    return this.#data.has(v);
  }

  public values(): IterableIterator<T> {
    return this.#data.values();
  }

  public get size(): number {
    return this.#data.size;
  }

  public forEach(
    callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void,
    thisArg?: unknown
  ): void {
    this.#data.forEach((v, v2) => callbackfn.call(thisArg, v, v2, this));
  }

  public [Symbol.iterator](): IterableIterator<T> {
    return this.#data[Symbol.iterator]();
  }

  public entries(): IterableIterator<[T, T]> {
    return this.#data.entries();
  }

  public keys(): IterableIterator<T> {
    return this.#data.keys();
  }
}

export class DependencyGraphBuilder {
  private forward = new Map<string, Set<string>>();
  private reverse = new Map<string, Set<string>>();

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

export class IncrementalInvalidator {
    constructor(private readonly graph: DependencyGraph) { }

    public invalidate(node: string): ReadonlySet<string> {
        const affected = new Set<string>();
        const queue = [node];
        while (queue.length > 0) {
            const curr = queue.shift()!;
            for (const dep of this.graph.reverse.get(curr) ?? []) {
                if (!affected.has(dep)) {
                    affected.add(dep);
                    queue.push(dep);
                }
            }
        }
        return new FrozenSet(affected);
    }
}

/**
 * Tarjan's Strongly Connected Components algorithm
 */
export class TarjanSCC {
    public static decompose(
        graph: DependencyGraph
    ): readonly (readonly string[])[] {
        const sccs: string[][] = [];
        const index = new Map<string, number>();
        const lowlink = new Map<string, number>();
        const stack: string[] = [];
        const onStack = new Set<string>();
        let nextIndex = 0;

        function strongConnect(node: string) {
            index.set(node, nextIndex);
            lowlink.set(node, nextIndex);
            nextIndex++;
            stack.push(node);
            onStack.add(node);

            const neighbors = graph.forward.get(node)?.values() || [];
            for (const neighbor of neighbors) {
                if (!index.has(neighbor)) {
                    strongConnect(neighbor);
                    lowlink.set(node, Math.min(lowlink.get(node)!, lowlink.get(neighbor)!));
                } else if (onStack.has(neighbor)) {
                    lowlink.set(node, Math.min(lowlink.get(node)!, index.get(neighbor)!));
                }
            }

            if (lowlink.get(node) === index.get(node)) {
                const scc: string[] = [];
                let w: string;
                do {
                    w = stack.pop()!;
                    onStack.delete(w);
                    scc.push(w);
                } while (w !== node);
                sccs.push(scc);
            }
        }

        for (const node of graph.forward.keys()) {
            if (!index.has(node)) {
                strongConnect(node);
            }
        }
        return sccs;
    }
}

/**
 * Union-Find data structure (Disjoint Set Union)
 */
export class UnionFind {
    private parent = new Map<number, number>();
    private rank = new Map<number, number>();

    public find(id: number): number {
        let root = id;
        while (this.parent.has(root) && this.parent.get(root) !== root) {
            root = this.parent.get(root)!;
        }
        // Path compression
        let curr = id;
        while (this.parent.has(curr) && this.parent.get(curr) !== root) {
            const next = this.parent.get(curr)!;
            this.parent.set(curr, root);
            curr = next;
        }
        return root;
    }

    public union(a: number, b: number): void {
        const rootA = this.find(a);
        const rootB = this.find(b);
        if (rootA === rootB) return;

        const rankA = this.rank.get(rootA) ?? 0;
        const rankB = this.rank.get(rootB) ?? 0;

        if (rankA < rankB) {
            this.parent.set(rootA, rootB);
        } else if (rankA > rankB) {
            this.parent.set(rootB, rootA);
        } else {
            this.parent.set(rootB, rootA);
            this.rank.set(rootA, rankA + 1);
        }
    }
}
