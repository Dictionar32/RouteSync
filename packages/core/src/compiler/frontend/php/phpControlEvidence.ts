/** Interface-first PHP control-evidence runtime boundary. */
import { scannerStatementControlContractAlgebra } from '../../../types/upstream/scannerStatementControlAlgebra';
import type {
  ScannerStatementControlJudgment,
} from '../../../types/upstream/scannerStatementControlInterface';
import type { TokenDescriptor } from './PhpAst';

export type PhpControlEvidence = ScannerStatementControlJudgment<TokenDescriptor>;

export interface PhpControlEvidenceInterface {
  readonly resolve: (token: TokenDescriptor) => PhpControlEvidence;
}

const resolvePhpControlEvidence = (token: TokenDescriptor): PhpControlEvidence =>
  scannerStatementControlContractAlgebra.resolve({
    tokens: [token],
    tokenValue: evidence => evidence.value,
  });

/** Runtime operation object; callers dispatch on the closed judgment ADT. */
export const phpControlEvidence: PhpControlEvidenceInterface = Object.freeze({
  resolve: resolvePhpControlEvidence,
});
