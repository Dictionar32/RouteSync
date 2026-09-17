/** Typed AST for controller-body facts consumed by semantic resolution. */
import type { AstIdentifier, SourceLineNumber, TokenDescriptor } from './phpAstTypes';

export type ValidationRuleLiteralAst = string & { readonly __validationRuleAst: unique symbol };

export interface InlineValidationAst {
    readonly field: AstIdentifier;
    readonly rules: readonly ValidationRuleLiteralAst[];
    readonly source: TokenDescriptor;
}

export type HttpErrorStatusAst = number & { readonly __httpErrorStatusAst: unique symbol };

export interface ControllerErrorAst {
    readonly status: HttpErrorStatusAst;
    readonly source: TokenDescriptor;
}

export interface ControllerBodyAst {
    readonly validations: readonly InlineValidationAst[];
    readonly errors: readonly ControllerErrorAst[];
}

export function createValidationRuleLiteral(value: string): ValidationRuleLiteralAst {
    return value as ValidationRuleLiteralAst;
}

export function createHttpErrorStatus(value: number): HttpErrorStatusAst {
    if (!Number.isInteger(value) || value < 400 || value >= 600) {
        throw new Error(`Invalid HTTP error status: ${value}`);
    }
    return value as HttpErrorStatusAst;
}
