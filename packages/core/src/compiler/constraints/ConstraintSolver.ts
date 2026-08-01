/**
 * ConstraintSolver.ts
 * Main constraint solver implementation
 */

import type { SemanticType } from '../types/SemanticType';
import { UnionType } from '../types/SemanticType';
import { TypeSystem } from '../types/TypeSystem';
import { TypeHierarchy } from '../types/TypeHierarchy';
import { ImmutableSet } from '../utils/ImmutableCollections';
import type { Constraint, ConstraintViolation } from './Constraint';
import { TypeEnvironment, type VariableState } from './TypeEnvironment';
import { UnionFind } from './UnionFind';

export class ConstraintSolver {
    public readonly diagnostics: ConstraintViolation[] = [];

    private checkAssignability(source: SemanticType, target: SemanticType): boolean {
        const hierarchy: TypeHierarchy = { getParent: () => undefined };
        const ts = new TypeSystem(hierarchy);
        return ts.isAssignable(source, target);
    }

    private typeName(type: SemanticType): string {
        switch (type.kind) {
            case 'primitive': return type.type;
            case 'reference': return `${type.namespace}\\${type.name}`;
            case 'union': return 'union';
            default: return type.kind;
        }
    }

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
            for (const constraint of this.getAffectedConstraints(variable, constraintIndex)) {
                if (this.solveConstraint(constraint, uf, states)) {
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
            const resolved = this.resolveVariable(rep, repState);
            if (resolved) {
                environment = environment.bind(id, resolved);
            }
        }

        return environment;
    }

    private join(types: Set<SemanticType>): SemanticType | undefined {
        if (types.size === 0) return undefined;
        if (types.size === 1) return Array.from(types.values())[0];
        return new UnionType(new ImmutableSet(types));
    }

    private resolveVariable(id: number, state: VariableState): SemanticType | undefined {
        const lower = this.join(state.lowerBounds);
        if (lower) return lower;
        return this.join(state.upperBounds);
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
                    result.add(c.source.id);
                    result.add(c.expected.id);
                    break;
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

    private getAffectedConstraints(variable: number, index: Map<number, Constraint[]>): readonly Constraint[] {
        return index.get(variable) ?? [];
    }

    private solveConstraint(constraint: Constraint, uf: UnionFind, states: Map<number, VariableState>): boolean {
        switch (constraint.kind) {
            case 'PropertyExists':
                const srcState = states.get(constraint.source.id);
                if (srcState) {
                    for (const type of srcState.lowerBounds) {
                        if (type.kind === 'object') {
                            const propType = type.properties.get(constraint.property);
                            if (propType) {
                                const expState = states.get(constraint.expected.id) || { lowerBounds: new Set(), upperBounds: new Set() };
                                expState.lowerBounds.add(propType);
                                states.set(constraint.expected.id, expState);
                                return true;
                            }
                        }
                    }
                }
                return false;
            case 'Equality':
                const rootA = uf.find(constraint.source.id);
                const rootB = uf.find(constraint.target.id);
                uf.union(constraint.source.id, constraint.target.id);
                const newRoot = uf.find(constraint.source.id);

                const stateA = states.get(rootA);
                const stateB = states.get(rootB);
                if (stateA || stateB) {
                    const merged: VariableState = {
                        lowerBounds: new Set([...(stateA?.lowerBounds || []), ...(stateB?.lowerBounds || [])]),
                        upperBounds: new Set([...(stateA?.upperBounds || []), ...(stateB?.upperBounds || [])])
                    };
                    states.set(newRoot, merged);
                }
                return true;
            case 'Subtype':
                const sourceState = states.get(constraint.source.id) || { lowerBounds: new Set(), upperBounds: new Set() };
                const destState = states.get(constraint.target.id) || { lowerBounds: new Set(), upperBounds: new Set() };

                let changed = false;
                for (const lower of sourceState.lowerBounds) {
                    if (!destState.lowerBounds.has(lower)) {
                        destState.lowerBounds.add(lower);
                        changed = true;

                        for (const upper of destState.upperBounds) {
                            if (!this.checkAssignability(lower, upper)) {
                                this.diagnostics.push({
                                    code: 'RS1023',
                                    message: `Type conflict: Lower bound type '${this.typeName(lower)}' is incompatible with upper bound type '${this.typeName(upper)}'.`,
                                    location: constraint.span
                                });
                            }
                        }
                    }
                }
                for (const upper of destState.upperBounds) {
                    if (!sourceState.upperBounds.has(upper)) {
                        sourceState.upperBounds.add(upper);
                        changed = true;

                        for (const lower of sourceState.lowerBounds) {
                            if (!this.checkAssignability(lower, upper)) {
                                this.diagnostics.push({
                                    code: 'RS1023',
                                    message: `Type conflict: Lower bound type '${this.typeName(lower)}' is incompatible with upper bound type '${this.typeName(upper)}'.`,
                                    location: constraint.span
                                });
                            }
                        }
                    }
                }
                if (changed) {
                    states.set(constraint.source.id, sourceState);
                    states.set(constraint.target.id, destState);
                }
                return changed;
            case 'HasType':
                const hState = states.get(constraint.source.id) || { lowerBounds: new Set(), upperBounds: new Set() };
                let hChanged = false;
                if (!hState.lowerBounds.has(constraint.type)) {
                    hState.lowerBounds.add(constraint.type);
                    hChanged = true;
                }
                if (!hState.upperBounds.has(constraint.type)) {
                    hState.upperBounds.add(constraint.type);
                    hChanged = true;
                }
                if (hChanged) {
                    states.set(constraint.source.id, hState);
                }
                return hChanged;
            default:
                return false;
        }
    }
}
