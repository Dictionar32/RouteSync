/** Canonical algebra for structured-statement control evidence. */
import { relationEqual } from '../../semantic/relations/semanticRelations';
import { relationFirstOption, relationOptionFold } from '../../semantic/relations/relationalSequence';
import type {
  ScannerStatementControlInterface,
  ScannerStatementControlJudgment,
  ScannerStatementControlKind,
  ScannerStatementControlQuery,
} from './scannerStatementControlInterface';

type ControlKeyword = Readonly<{ readonly keyword: string; readonly control: ScannerStatementControlKind }>;

/** PHP source spellings are evidence vocabulary; the judgment is language-semantic. */
const controlKeywords: readonly ControlKeyword[] = Object.freeze([
  { keyword: 'if', control: 'conditional' },
  { keyword: 'foreach', control: 'collection_iteration' },
  { keyword: 'for', control: 'counted_iteration' },
  { keyword: 'while', control: 'pretest_iteration' },
  { keyword: 'switch', control: 'selection_dispatch' },
  { keyword: 'try', control: 'exception_guard' },
  { keyword: 'throw', control: 'exception_raise' },
]);

export const scannerStatementControlContractAlgebra: ScannerStatementControlInterface = Object.freeze({
  resolve: <Token>(query: ScannerStatementControlQuery<Token>): ScannerStatementControlJudgment<Token> => {
    const evidence = query.tokens[0];
    if (evidence === undefined) return { kind: 'not_structured' };
    return relationOptionFold(
      relationFirstOption(controlKeywords, candidate => relationEqual(candidate.keyword, query.tokenValue(evidence))),
      () => ({ kind: 'not_structured' as const, evidence }),
      candidate => ({ kind: 'structured' as const, control: candidate.control, evidence }),
    );
  },
});
