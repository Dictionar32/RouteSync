import type { PhpAstValue, PhpBlock, PhpIfAlternative } from '../phpAstTypes';
import { numberValue } from '../../../../types/upstream/valueObjects';
import type { StatementIndex } from '../../../../types/upstream/valueObjects';
import type { ControllerDataflowSourcePayload } from '../../../../types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface';
import type { ControllerDataflowSourcePayloadEvidenceAdapterInterface, ControllerDataflowSourcePayloadEvidenceInput } from '../../../../types/upstream/controllerDataflowSourcePayloadEvidenceAdapterInterface';

export type PhpControllerDataflowPayload = Readonly<{ readonly statementIndex: StatementIndex; readonly value: PhpAstValue }>;

const addPayload = (sourceFile: ControllerDataflowSourcePayloadEvidenceInput<PhpBlock>['sourceFile'], statementIndex: StatementIndex, value: PhpAstValue): ControllerDataflowSourcePayload<PhpControllerDataflowPayload> => Object.freeze({
  kind: 'controller_dataflow_source_payload',
  source: Object.freeze({
    kind: 'source_span',
    file: sourceFile,
    start: numberValue(value.source.startOffset),
    end: numberValue(value.source.endOffset),
  }),
  payload: Object.freeze({ statementIndex, value }),
});

const collect = (input: ControllerDataflowSourcePayloadEvidenceInput<PhpBlock>): readonly ControllerDataflowSourcePayload<PhpControllerDataflowPayload>[] => {
  const payloads: ControllerDataflowSourcePayload<PhpControllerDataflowPayload>[] = [];
  let nextStatementIndex = 0;
  const add = (statementIndex: StatementIndex, value: PhpAstValue): void => {
    payloads.push(addPayload(input.sourceFile, statementIndex, value));
  };
  const visitAlternative = (alternative: PhpIfAlternative): void => {
    switch (alternative.kind) {
      case 'else_block': visit(alternative.block); return;
      case 'else_if': visit({ kind: 'block', statements: [alternative.statement] }); return;
      case 'none': return;
      default: {
        const exhaustive: never = alternative;
        return exhaustive;
      }
    }
  };
  const visit = (block: PhpBlock): void => {
    for (const statement of block.statements) {
      const statementIndex = numberValue(nextStatementIndex);
      nextStatementIndex += 1;
      switch (statement.kind) {
        case 'assignment':
          add(statementIndex, statement.value);
          break;
        case 'expression_statement':
        case 'return_with_value':
        case 'throw_statement':
        case 'include_statement':
          add(statementIndex, statement.expression);
          break;
        case 'if_statement':
          add(statementIndex, statement.condition);
          visit(statement.thenBlock);
          visitAlternative(statement.alternative);
          break;
        case 'foreach_statement':
          add(statementIndex, statement.iterable);
          visit(statement.body);
          break;
        case 'for_statement':
          for (const clause of [statement.initializer, statement.condition, statement.update]) {
            switch (clause.kind) {
              case 'expression': add(statementIndex, clause.value); break;
              case 'assignment': add(statementIndex, clause.value); break;
              case 'empty': break;
              default: {
                const exhaustive: never = clause;
                return exhaustive;
              }
            }
          }
          visit(statement.body);
          break;
        case 'while_statement':
          add(statementIndex, statement.condition);
          visit(statement.body);
          break;
        case 'switch_statement':
          add(statementIndex, statement.subject);
          for (const branch of statement.cases) {
            switch (branch.kind) {
              case 'case': branch.labels.forEach(label => add(statementIndex, label)); break;
              case 'default': break;
              default: {
                const exhaustive: never = branch;
                return exhaustive;
              }
            }
            visit(branch.body);
          }
          break;
        case 'try_statement':
          visit(statement.body);
          statement.catches.forEach(clause => visit(clause.body));
          if (statement.finallyBlock.kind === 'present') visit(statement.finallyBlock.block);
          break;
        case 'return_void':
        case 'unset_statement':
          break;
        default: {
          const exhaustive: never = statement;
          return exhaustive;
        }
      }
    }
  };
  visit(input.source);
  return Object.freeze(payloads);
};

export const phpControllerDataflowSourcePayloadEvidenceAdapter: ControllerDataflowSourcePayloadEvidenceAdapterInterface<PhpBlock, PhpControllerDataflowPayload> = Object.freeze({
  kind: 'controller_dataflow_source_payload_evidence_adapter',
  contractVersion: 1,
  collect,
});
