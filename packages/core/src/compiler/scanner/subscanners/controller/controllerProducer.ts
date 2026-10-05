import { createDomainAstJudgment, type ControllerAst } from '../../../../types/upstream/ast';
import type { SourceFile } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ControllerMethod, ControllerMethodContract } from '../../../../types/upstream/controller';
import type { ControllerActionFlowContract } from '../../../../types/upstream/highLevelContracts';
import type { ControllerDeclarationEvidence } from '../../../../types/upstream/controllerEvidence';
import type { Sequence } from '../../../../types/upstream/collections';
import { relationFoldRight, relationProject, relationSelect } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';

export type ControllerProducerInput = {
    readonly declaration: ControllerDeclarationEvidence;
    readonly file: SourceFile;
    readonly source: SourceSpan;
};

export interface ControllerProducerResult {
    readonly ast: ControllerAst;
    readonly actions: Sequence<ControllerActionFlowContract>;
    readonly methods: Sequence<ControllerMethodContract>;
}

export interface ControllerProducer {
    readonly produce: (input: ControllerProducerInput) => ControllerProducerResult;
}

const sequence = <T>(items: readonly T[]): Sequence<T> => relationFoldRight(items, { kind: 'empty' } as Sequence<T>, (item, tail) => ({ kind: 'cons', head: item, tail }));

const implementation: ControllerProducer = {
    produce: (input) => {
        const methodValues: readonly ControllerActionFlowContract[] = relationProject(input.declaration.methods, ({ action }) => action);
        const actions = sequence(relationSelect(methodValues, method => relationEqual(method.kind, 'controller_action')));
        const methods: Sequence<ControllerMethod> = sequence(relationProject(methodValues, method => method));
        const contracts: Sequence<ControllerMethodContract> = sequence(relationProject(input.declaration.methods, ({ contract }) => contract));
        return {
            ast: createDomainAstJudgment({ kind: 'controller_ast', semantic: methods, source: input.source }),
            actions,
            methods: contracts,
        };
    },
};

export const controllerProducer: ControllerProducer = implementation;
