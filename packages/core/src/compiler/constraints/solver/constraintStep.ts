/**
 * constraintStep.ts
 *
 * Dispatches individual constraint types (PropertyExists, Equality, Subtype, HasType)
 * during constraint solving.
 *
 * @module compiler/constraints/solver
 */

import type { SemanticType } from '../../types/SemanticType';
import { TypeSystem } from '../../types/TypeSystem';
import { TypeHierarchy } from '../../types/TypeHierarchy';
import type { Constraint, ConstraintViolation } from '../Constraint';
import type { VariableState } from '../TypeEnvironment';
import type { UnionFind } from '../UnionFind';

function checkAssignability(source: SemanticType, target: SemanticType): boolean {
    const hierarchy: TypeHierarchy = { getParent: () => undefined };
    const ts = new TypeSystem(hierarchy);
    return ts.isAssignable(source, target);
}

function typeName(type: SemanticType): string {
    switch (type.kind) {
        case 'primitive': return type.type;
        case 'reference': return `${type.namespace}\\${type.name}`;
        case 'union': return 'union';
        default: return type.kind;
    }
}

export function solveConstraintStep(
    constraint: Constraint,
    uf: UnionFind,
    states: Map<number, VariableState>,
    diagnostics: ConstraintViolation[]
): boolean {
    switch (constraint.kind) {
        case 'PropertyExists': {
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
        }

        case 'Equality': {
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
        }

        case 'Subtype': {
            const sourceState = states.get(constraint.source.id) || { lowerBounds: new Set(), upperBounds: new Set() };
            const destState = states.get(constraint.target.id) || { lowerBounds: new Set(), upperBounds: new Set() };

            let changed = false;
            for (const lower of sourceState.lowerBounds) {
                if (!destState.lowerBounds.has(lower)) {
                    destState.lowerBounds.add(lower);
                    changed = true;

                    for (const upper of destState.upperBounds) {
                        if (!checkAssignability(lower, upper)) {
                            diagnostics.push({
                                code: 'RS1023',
                                message: `Type conflict: Lower bound type '${typeName(lower)}' is incompatible with upper bound type '${typeName(upper)}'.`,
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
                        if (!checkAssignability(lower, upper)) {
                            diagnostics.push({
                                code: 'RS1023',
                                message: `Type conflict: Lower bound type '${typeName(lower)}' is incompatible with upper bound type '${typeName(upper)}'.`,
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
        }

        case 'HasType': {
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
        }

        default:
            return false;
    }
}
