import { createDomainAstJudgment, type AttributeAst } from '../../types/upstream/ast';
import type { AttributeDefinition } from '../../types/upstream/application';
import type { Expression } from '../../types/upstream/expression';
import { createClassName, createMethodName } from '../../types/upstream/names';
import type { SourceSpan } from '../../types/upstream/provenance';
import type { ControllerDeclarationAst, ControllerMethodAst } from './lexer/controllerAstTypes';
import type { PhpAstValue } from './lexer/phpAstExpressionTypes';
import type { AttributeProducerInput, AttributeProducerInterface, AttributeProducerJudgment } from './attributeProducerInterface';
import type { PhpClassMethodDeclarationInventory } from '../../types/upstream/phpClassConstructorSelectionInterface';

const constructorEvidence = (method: ControllerMethodAst<false>): PhpAstValue => ({
  kind: 'closure',
  parameters: method.parameters.map(parameter => ({
    variable: parameter.name,
    type: parameter.type,
    defaultValue: parameter.defaultValue,
    passing: { kind: 'by_value' },
    variadic: { kind: 'fixed' },
  })),
  captures: [],
  returnType: method.declaredReturnType.kind === 'absent'
    ? { kind: 'absent' }
    : { kind: 'declared', type: method.declaredReturnType.type },
  body: { kind: 'block', statements: method.body.statements },
  source: {
    startOffset: method.source.startOffset,
    endOffset: method.source.endOffset,
  },
});

const constructorExpression = (input: AttributeProducerInput, method: ControllerMethodAst<false>): Expression =>
  input.expressionAuthority.derive({
    kind: 'php_ast_expression_evidence',
    evidence: constructorEvidence(method),
    sourceFile: input.source.file,
    classContext: { kind: 'none' },
  });

const produceAttribute = (input: AttributeProducerInput, constructor: ControllerMethodAst<false>): AttributeAst => {
  const definition: AttributeDefinition = {
    kind: 'attribute',
    name: createClassName(input.declaration.className),
    file: input.source.file,
    constructor: constructorExpression(input, constructor),
    contextual: input.contextuality.kind === 'laravel_contextual_attribute_declaration_evidence',
    source: input.source,
  };
  return createDomainAstJudgment({ kind: 'attribute_ast', semantic: definition, source: input.source });
};

export const attributeProducer: AttributeProducerInterface = Object.freeze({
  kind: 'attribute_producer',
  closed: true,
  contractVersion: 5,
  produce(input): AttributeProducerJudgment {
    const constructorInventory: PhpClassMethodDeclarationInventory<ControllerMethodAst<false>> = input.declaration.methodDeclarationInventory.kind === 'controller_method_declaration_inventory_complete'
      ? Object.freeze({
        kind: 'php_class_method_declaration_inventory_complete',
        classSource: input.source,
        declarations: Object.freeze(input.declaration.methodDeclarationInventory.declarations.map(method => Object.freeze({
          name: createMethodName(method.name),
          source: Object.freeze({
            kind: 'source_span' as const,
            file: input.source.file,
            start: Object.freeze({ kind: 'number_value' as const, value: method.source.startOffset }),
            end: Object.freeze({ kind: 'number_value' as const, value: method.source.endOffset }),
          }),
          value: method,
        }))),
      })
      : Object.freeze({
        kind: 'php_class_method_declaration_inventory_blocked',
        classSource: input.source,
        blockers: Object.freeze(input.declaration.methodDeclarationInventory.candidates.map(candidate => Object.freeze({
          kind: 'php_class_method_declaration_enumeration_incomplete' as const,
          source: Object.freeze({
            kind: 'source_span' as const,
            file: input.source.file,
            start: Object.freeze({ kind: 'number_value' as const, value: candidate.startOffset }),
            end: Object.freeze({ kind: 'number_value' as const, value: candidate.endOffset }),
          }),
        }))),
      });
    const constructorSelection = input.constructorSelectionAuthority.select(constructorInventory);
    return constructorSelection.kind === 'php_class_constructor_selected'
      ? Object.freeze({ kind: 'attribute_producer_complete', attribute: produceAttribute(input, constructorSelection.method.value) })
      : constructorSelection.kind === 'php_class_constructor_missing'
        ? Object.freeze({ kind: 'attribute_producer_blocked', blocker: Object.freeze({ kind: 'attribute_producer_constructor_missing', declarationSource: input.source }) })
        : constructorSelection.kind === 'php_class_constructor_ambiguous'
          ? Object.freeze({ kind: 'attribute_producer_blocked', blocker: Object.freeze({ kind: 'attribute_producer_constructor_ambiguous', declarationSource: input.source, candidates: constructorSelection.candidates }) })
          : Object.freeze({ kind: 'attribute_producer_blocked', blocker: Object.freeze({ kind: 'attribute_producer_constructor_inventory_blocked', declarationSource: input.source, blockers: Object.freeze(constructorSelection.blockers.map(blocker => blocker.source)) }) });
  },
});
