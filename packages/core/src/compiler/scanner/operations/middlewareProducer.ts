import { relationOptionFold, relationFirst } from '../../../semantic/relations/relationalSequence';
import { relationEqual } from '../../../semantic/relations/semanticRelations';
import { createDomainAstJudgment, type MiddlewareAst } from '../../../types/upstream/ast';
import type { MiddlewareDefinition } from '../../../types/upstream/application';
import { createClassName } from '../../../types/upstream/names';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { ControllerDeclarationAst } from '../../frontend/php/controllerAstTypes';
import { controllerAstCanonicalOperations } from './controller/controllerAstCanonical';

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
    const handle = relationOptionFold(relationFirst(input.declaration.methods, method => relationEqual(method.name, 'handle')), () => { throw Error(`Middleware handle method not found: ${input.source.file.value.value}`); }, value => value);

    const name = createClassName(input.declaration.className);
    const definition: MiddlewareDefinition = {
      kind: 'middleware',
      name,
      file: input.source.file,
      handle: controllerAstCanonicalOperations.controllerActionFromMethod(
        handle,
        name.value.value,
        input.source.file.value.value,
        { kind: 'response_reference_not_declared' },
      ),
      source: input.source,
    };

    return createDomainAstJudgment({ kind: 'middleware_ast', semantic: definition, source: input.source });
  },
};
