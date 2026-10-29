/**
 * Neutral syntax vocabulary for statement evidence.
 *
 * Concrete parser spellings live here only. Semantic and analysis layers use
 * the neutral vocabulary on the left, so source-language control constructs
 * cannot become semantic ontology.
 */
export const PHP_STATEMENT_KINDS = Object.freeze({
  conditional: 'if_statement',
  collectionRecurrence: 'foreach_statement',
  countedRecurrence: 'for_statement',
  preTestRecurrence: 'while_statement',
  multiCandidateDispatch: 'switch_statement',
} as const);
