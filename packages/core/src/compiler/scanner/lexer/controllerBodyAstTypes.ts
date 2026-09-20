/** Typed AST for controller-body facts consumed by semantic resolution. */
import type { AstIdentifier, TokenDescriptor, PhpAstValue, PhpBlock, PhpStatement } from './phpAstTypes';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';

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

export type ControllerVariableDefinitionOrigin =
    | { readonly kind: 'assignment' }
    | { readonly kind: 'foreach'; readonly statementIndex: number }
    | { readonly kind: 'catch'; readonly statementIndex: number };

export type ControllerDefinitionAvailability =
    | { readonly kind: 'definite' }
    | { readonly kind: 'branch_conditional'; readonly branchPath: readonly number[] }
    | { readonly kind: 'loop_conditional'; readonly branchPath: readonly number[] }
    | { readonly kind: 'catch_conditional'; readonly branchPath: readonly number[] };

export interface ControllerVariableDefinition {
    readonly name: AstIdentifier;
    readonly statementIndex: number;
    readonly origin: ControllerVariableDefinitionOrigin;
    readonly value: PhpAstValue;
    /** Semantic fact produced at the scanner boundary; consumers must not infer model/resource meaning again. */
    readonly semantic: ControllerVariableSemantic;
    readonly availability: ControllerDefinitionAvailability;
}

export type ControllerVariableOrigin =
    | { readonly kind: 'parameter' }
    | { readonly kind: 'local_assignment'; readonly statementIndex: number }
    | { readonly kind: 'foreach_binding'; readonly statementIndex: number }
    | { readonly kind: 'catch_binding'; readonly statementIndex: number }
    | { readonly kind: 'external' };

export interface ControllerVariableReference {
    readonly name: AstIdentifier;
    readonly statementIndex: number;
    readonly origin: ControllerVariableOrigin;
}

export interface ControllerDataflowAst {
    readonly definitions: readonly ControllerVariableDefinition[];
    readonly references: readonly ControllerVariableReference[];
}

export interface ControllerBodyAst {
    readonly statements: readonly PhpStatement[];
    readonly validations: readonly InlineValidationAst[];
    readonly errors: readonly ControllerErrorAst[];
    readonly dataflow: ControllerDataflowAst;
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
