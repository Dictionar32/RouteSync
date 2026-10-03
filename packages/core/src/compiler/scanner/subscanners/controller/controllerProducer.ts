import { createDomainAstJudgment, type ControllerAst } from '../../../../types/upstream/ast';
import type { ControllerName, SourceFile } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ControllerDependency, ControllerResponse } from '../../../../types/upstream/controller';
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';
import type { Sequence } from '../../../../types/upstream/collections';
import { relationFoldRight, relationProject, relationOptionalFold } from '../../../../semantic/kernel/relationalSequence';
import { controllerActionFromMethod } from './controllerAstCanonical';

export type ControllerProducerInput = {
    readonly methods: readonly {
        readonly method: ControllerMethodAst;
        readonly response: ControllerResponse;
        readonly dependencies?: readonly ControllerDependency[];
    }[];
    readonly controller: ControllerName;
    readonly file: SourceFile;
    readonly source: SourceSpan;
};

export interface ControllerProducer {
    readonly produce: (input: ControllerProducerInput) => ControllerAst;
}

const sequence = <T>(items: readonly T[]): Sequence<T> => relationFoldRight(items, { kind: 'empty' } as Sequence<T>, (item, tail) => ({ kind: 'cons', head: item, tail }));

const implementation: ControllerProducer = {
    produce: (input) => createDomainAstJudgment({
        kind: 'controller_ast',
        semantic: sequence(relationProject(input.methods, ({ method, response, dependencies }) => controllerActionFromMethod(
            method, input.controller.value.value, input.file.value.value, response, relationOptionalFold(dependencies, () => [], value => value),
        ))),
        source: input.source,
    }),
};

export const controllerProducer: ControllerProducer = implementation;
