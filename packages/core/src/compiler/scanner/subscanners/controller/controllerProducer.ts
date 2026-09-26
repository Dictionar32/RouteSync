import type { ControllerAst } from '../../../../types/upstream/ast';
import type { ControllerName, SourceFile } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ControllerResponse } from '../../../../types/upstream/controller';
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';
import type { Sequence } from '../../../../types/upstream/collections';
import { controllerActionFromMethod } from './controllerAstCanonical';

export type ControllerProducerInput = {
    readonly methods: readonly {
        readonly method: ControllerMethodAst;
        readonly response: ControllerResponse;
    }[];
    readonly controller: ControllerName;
    readonly file: SourceFile;
    readonly source: SourceSpan;
};

export interface ControllerProducer {
    readonly produce: (input: ControllerProducerInput) => ControllerAst;
}

const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>(
    (tail, item) => ({ kind: 'cons', head: item, tail }),
    { kind: 'empty' },
);

const implementation: ControllerProducer = {
    produce: (input) => ({
        kind: 'controller_ast',
        methods: sequence(input.methods.map(({ method, response }) => controllerActionFromMethod(
            method,
            input.controller.value.value,
            input.file.value.value,
            response,
        ))),
        source: input.source,
    }),
};

export const controllerProducer: ControllerProducer = implementation;
