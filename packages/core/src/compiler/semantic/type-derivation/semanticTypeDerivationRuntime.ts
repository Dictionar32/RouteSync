import { semanticTypeDerivationAuthority } from './semanticTypeDerivationAuthority';
import { createSemanticTypeDerivationRuntimeExecutor } from './semanticTypeDerivationRuntimeExecutor';

/** Concrete composition root: authority selection is kept outside scanner wiring. */
export const semanticTypeDerivationRuntimeExecutor = createSemanticTypeDerivationRuntimeExecutor(
  semanticTypeDerivationAuthority,
);
