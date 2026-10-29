/** Compiler-side evidence projection only; semantic body judgments belong to the existing body authority. */
import type { ControllerDataflowAst } from '../../../frontend/php/controllerBodyAstTypes';
import type { PhpStatement } from '../../../frontend/php/phpAstTypes';

export interface ControllerBodyEvidenceProjection {
    readonly statements: readonly PhpStatement[];
    readonly dataflow: ControllerDataflowAst;
}

