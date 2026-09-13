/**
 * ConstraintSolver.ts
 * Main constraint solver implementation.
 * Active Consumer orchestrating constraint steps and variable bound resolution.
 *
 * @module compiler/constraints/ConstraintSolver
 */

import type { SemanticType } from '../types/SemanticType';
import type { Constraint, ConstraintViolation } from './Constraint';
import { TypeEnvironment, type VariableState } from './TypeEnvironment';
import { UnionFind } from './UnionFind';
import { solveConstraintStep, resolveVariableFromBounds } from './solver';

export { solveConstraintStep, resolveVariableFromBounds };

export class ConstraintSolver {
    public readonly diagnostics: ConstraintViolation[] = [];

    public solve(constraints: readonly Constraint[]): TypeEnvironment {
        this.diagnostics.length = 0;
        let environment = new TypeEnvironment();
        const uf = new UnionFind();
        const worklist: number[] = [];
        const constraintIndex = new Map<number, Constraint[]>();
        const states = new Map<number, VariableState>();
        const neighbors = new Map<number, Set<number>>();

        for (const constraint of constraints) {
            const list = constraintIndex.get(constraint.source.id) ?? [];
            list.push(constraint);
            constraintIndex.set(constraint.source.id, list);

            if (constraint.kind === 'Subtype') {
                const srcSet = neighbors.get(constraint.source.id) ?? new Set();
                srcSet.add(constraint.target.id);
                neighbors.set(constraint.source.id, srcSet);

                const dstSet = neighbors.get(constraint.target.id) ?? new Set();
                dstSet.add(constraint.source.id);
                neighbors.set(constraint.target.id, dstSet);
            }
        }

        const vars = this.collectVariables(constraints);
        worklist.push(...vars);

        while (worklist.length > 0) {
            const variable = worklist.pop()!;
            const affected = constraintIndex.get(variable) ?? [];
            for (const constraint of affected) {
                if (solveConstraintStep(constraint, uf, states, this.diagnostics)) {
                    const adj = neighbors.get(variable) ?? new Set();
                    for (const next of adj) {
                        worklist.push(next);
                    }
                }
            }
        }

        for (const [id, state] of states.entries()) {
            const rep = uf.find(id);
            const repState = states.get(rep) || state;
            const resolved = resolveVariableFromBounds(repState);
            if (resolved) {
                environment = environment.bind(id, resolved);
            }
        }

        return environment;
    }

    private collectVariables(constraints: readonly Constraint[]): readonly number[] {
        const result = new Set<number>();
        for (const c of constraints) {
            switch (c.kind) {
                case 'Subtype':
                    result.add(c.source.id);
                    result.add(c.target.id);
                    break;
                case 'PropertyExists':
                case 'ReturnType':
                    result.add(c.source.id);
                    result.add(c.expected.id);
                    break;
                case 'HasType':
                    result.add(c.source.id);
                    break;
            }
        }
        return Array.from(result.values());
    }
}
