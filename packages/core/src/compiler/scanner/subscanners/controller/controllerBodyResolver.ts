/** Compiler-side evidence projection only; semantic body judgments belong to the existing body authority. */
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { PhpStatement } from '../../lexer/phpAstTypes';

export interface ControllerBodyEvidenceProjection {
    readonly statements: readonly PhpStatement[];
    readonly dataflow: ControllerDataflowAst;
}

