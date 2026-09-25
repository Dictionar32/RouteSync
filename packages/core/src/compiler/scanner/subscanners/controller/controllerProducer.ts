import type { ControllerAst } from '../../../../types/upstream/ast';
import type { ControllerName } from '../../../../types/upstream/names';
import type { SourceFile, SourceSpan } from '../../../../types/upstream/provenance';
import type { ControllerResponse } from '../../../../types/upstream/controller';
import type { ControllerMethodAst } from '../../lexer/controllerAstTypes';
import { controllerAstFromMethod } from './controllerAstCanonical';

export type ControllerProducerInput = {
    readonly method: ControllerMethodAst;
    readonly controller: ControllerName;
    readonly file: SourceFile;
    readonly source: SourceSpan;
    readonly response: ControllerResponse;
};

export interface ControllerProducer {
    readonly produce: (input: ControllerProducerInput) => ControllerAst;
}

const implementation: ControllerProducer = {
    produce: (input) => controllerAstFromMethod(
        input.method,
        input.controller.value.value,
        input.file.value.value,
        input.response,
    ),
};

export const controllerProducer: ControllerProducer = implementation;
