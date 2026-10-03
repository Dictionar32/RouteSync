/** Immutable relation-backed SSA version state. */

import type { Operand } from '../../../utils/ControlFlowGraph';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationResolve, relationEqual, type RelationOption } from '../../../../semantic/kernel/relationFoundation';

export interface VariableVersionScope {
    readonly count: RelationIndex<number, number>;
    readonly stack: RelationIndex<number, readonly number[]>;
    readonly init: (target: number) => VariableVersionScope;
    readonly pushVersion: (target: number) => readonly [VariableVersionScope, number];
    readonly popVersion: (target: number) => VariableVersionScope;
    readonly getActiveVersion: (target: number) => RelationOption<number>;
    readonly renameOperand: (operand: Operand) => Operand;
}

const createScope = (
    count: RelationIndex<number, number> = [],
    stack: RelationIndex<number, readonly number[]> = [],
): VariableVersionScope => {
    const init = (target: number): VariableVersionScope => createScope(
        relationIndexAdd(count, target, 0),
        relationIndexAdd(stack, target, Object.freeze([0])),
    );
    const pushVersion = (target: number): readonly [VariableVersionScope, number] => {
        const current = relationOptionFold(relationIndexLookup(count, target), () => 0, value => value);
        const next = current + 1;
        const active = relationOptionFold(relationIndexLookup(stack, target), () => [], value => value);
        return [
            createScope(
                relationIndexAdd(count, target, next),
                relationIndexAdd(stack, target, Object.freeze([...active, next])),
            ),
            next,
        ];
    };
    const popVersion = (target: number): VariableVersionScope => {
        const active = relationOptionFold(relationIndexLookup(stack, target), () => [], value => value);
        return createScope(count, relationIndexAdd(stack, target, Object.freeze(active.slice(0, Math.max(0, active.length - 1)))));
    };
    const getActiveVersion = (target: number): RelationOption<number> => {
        const active = relationOptionFold(relationIndexLookup(stack, target), () => [], value => value);
        return relationResolve(relationEqual(active.length, 0), () => ({ kind: 'none' as const }), () => ({ kind: 'some' as const, value: active[active.length - 1] }));
    };
    const renameOperand = (operand: Operand): Operand => relationResolve(
        relationEqual(operand.kind, 'Variable'),
        () => relationOptionFold(getActiveVersion((operand as Extract<Operand, { kind: 'Variable' }>).id), () => operand, value => ({ kind: 'SSAValue' as const, id: value })),
        () => operand,
    );
    return Object.freeze({ count, stack, init, pushVersion, popVersion, getActiveVersion, renameOperand });
};

export const createVariableVersionScope = createScope;
export const VariableVersionScope = Object.freeze({ create: createVariableVersionScope });
