import type { MiddlewareAst } from '../../../types/upstream/ast';
import type { MiddlewareDefinition } from '../../../types/upstream/application';
import { createClassName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { ControllerDeclarationAst } from '../lexer/controllerAstTypes';
import { controllerActionFromMethod } from './controller/controllerAstCanonical';

/**
 * Syntax and provenance required to produce the canonical middleware AST.
 *
 * Discovery, tokenization, and PHP parsing stay in the scanner. This boundary
 * owns selecting the Laravel `handle` method and lowering its high-level
 * middleware contract into the upstream AST.
 */
export type MiddlewareProducerInput = {
  readonly declaration: ControllerDeclarationAst;
  readonly source: SourceSpan;
};

export interface MiddlewareProducer {
  readonly produce: (input: MiddlewareProducerInput) => MiddlewareAst;
}

export const middlewareProducer: MiddlewareProducer = {
  produce(input): MiddlewareAst {
    const handle = input.declaration.methods.find(method => method.name === 'handle');
    if (!handle) throw new Error(`Middleware handle method not found: ${input.source.file.value.value}`);

    const name = createClassName(input.declaration.className);
    const definition: MiddlewareDefinition = {
      kind: 'middleware',
      name,
      file: input.source.file,
      handle: controllerActionFromMethod(
        handle,
        name.value.value,
        input.source.file.value.value,
        { kind: 'response_absent' },
      ),
      source: input.source,
    };

    return {
      kind: 'middleware_ast',
      definition,
      source: input.source,
    };
  },
};
