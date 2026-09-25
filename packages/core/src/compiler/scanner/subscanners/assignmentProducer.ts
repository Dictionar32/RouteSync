import type { PhpStatement } from '../lexer/phpAstStatementTypes';
import type { Assignment, AssignmentAst } from '../../../types/upstream/assignment';
import type { SourceSpan } from '../../../types/upstream/provenance';
import { mapAssignmentTarget, mapAssignmentOperator, assignmentReferenceMode } from './resource/resourceUpstreamExpressionMappings';
import { mapResourcePhpAstToUpstream } from './resource/resourceUpstreamExpressionCanonical';

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
    const target = mapAssignmentTarget(statement.target, mapResourcePhpAstToUpstream, file);
    const expression = mapResourcePhpAstToUpstream(statement.value, file);
    const definition: Assignment = {
      kind: 'assignment',
      target,
      expression,
      operator: mapAssignmentOperator(statement.operator.kind),
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
