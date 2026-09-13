/**
 * variableVersionScope.ts
 *
 * Variable version tracking and operand renaming for Cytron's algorithm.
 *
 * @module core/compiler/analysis/ssa/renamer
 */

import type { Operand } from '../../../utils/ControlFlowGraph';

export class VariableVersionScope {
    private count = new Map<number, number>();
    private stack = new Map<number, number[]>();

    public init(target: number): void {
        this.count.set(target, 0);
        this.stack.set(target, [0]);
    }

    public pushVersion(varId: number): number {
        const next = (this.count.get(varId) ?? 0) + 1;
        this.count.set(varId, next);
        this.stack.get(varId)?.push(next);
        return next;
    }

    public popVersion(varId: number): void {
        this.stack.get(varId)?.pop();
    }

    public getActiveVersion(varId: number): number | undefined {
        const activeVersions = this.stack.get(varId) ?? [];
        return activeVersions[activeVersions.length - 1];
    }

    public renameOperand(op: Operand): Operand {
        if (op.kind === 'Variable') {
            const activeVersion = this.getActiveVersion(op.id);
            if (activeVersion !== undefined) {
                return { kind: 'SSAValue', id: activeVersion };
            }
        }
        return op;
    }
}
