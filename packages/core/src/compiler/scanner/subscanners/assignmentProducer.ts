import type { PhpStatement } from '../lexer/phpAstStatementTypes';
import type { Assignment, AssignmentAst } from '../../../types/upstream/assignment';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode } from './resource/resourceUpstreamExpressionMappings';
import { expressionFromPhpAst } from './expressionProducer';

export type AssignmentProducerInput = {
  readonly statement: Extract<PhpStatement, { readonly kind: 'assignment' }>;
  readonly source: SourceSpan;
};

export interface AssignmentProducer {
  readonly produce: (input: AssignmentProducerInput) => AssignmentAst;
}

const assignmentProducer: AssignmentProducer = {
  produce(input): AssignmentAst {
    const file = input.source.file.value.value;
    const statement = input.statement;
    const target = resolveAssignmentTarget(statement.target, expressionFromPhpAst, file);
    const expression = expressionFromPhpAst(statement.value, file);
    const definition: Assignment = {
      kind: 'assignment',
      target,
      expression,
      operator: resolveAssignmentOperator(statement.operator.kind),
      reference: assignmentReferenceMode(statement.reference.kind),
      source: input.source,
    };
    return {
      kind: 'assignment_ast',
      definition,
      source: input.source,
    };
  },
};

export { assignmentProducer };
