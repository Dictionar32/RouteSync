/** Compatibility facade; control-kind reasoning is owned by upstream algebra. */
import { scannerStatementControlContractAlgebra } from '../../../types/upstream/scannerStatementControlAlgebra';
import type { ScannerStatementControlKind } from '../../../types/upstream/scannerStatementControlInterface';
import { relationOptionFold, type RelationOption } from '../../../semantic/relations/relationalSequence';
import type { TokenDescriptor } from './PhpAst';

export type PhpControlEvidence = ScannerStatementControlKind;

export const phpControlEvidence = (token: TokenDescriptor): RelationOption<PhpControlEvidence> => {
  const judgment = scannerStatementControlContractAlgebra.resolve({
    tokens: [token],
    tokenValue: evidence => evidence.value,
  });
  switch (judgment.kind) {
    case 'not_structured':
      return { kind: 'none' };
    case 'structured':
      return { kind: 'some', value: judgment.control };
  }
};
