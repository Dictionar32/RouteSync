/**
 * UnionFind.ts
 * Union-Find data structure for constraint solving
 */

export class UnionFind {
    private parent = new Map<number, number>();
    private rank = new Map<number, number>();

    public find(id: number): number {
        let root = id;
        while (this.parent.has(root) && this.parent.get(root) !== root) {
            root = this.parent.get(root)!;
        }
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
