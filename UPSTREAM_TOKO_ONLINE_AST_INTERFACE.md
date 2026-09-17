# Upstream AST Interface Specification — Berbasis Laravel Toko-Online
## *Model Tinggi Level 7 (Zero Data Bebas, Zero Fake Branding, Atomic Colon Lexemes, Zero 'if')*

Dokumen ini adalah cetak biru (*blueprint*) dan kode implementasi antarmuka scanner hulu di RouteSync (`packages/core/src/compiler/scanner/lexer/`).

Seluruh model didasarkan langsung pada **Trace Nyata Source Code Laravel `toko-online`**:
- Lokasi: `/home/annas-zen/Documents/laragon-docker/www/toko-online`
- Berkas Utama: `routes/api.php`, 10 Controller, 8 FormRequest, 4 JsonResource, dan Model Eloquent.

---

## 1. Ground Truth: Mengapa Titik Dua ':' dan '::' Berbeda?

Dalam proses leksikal PHP (`compoundScanners.ts:48-60`), kursor pertama kali membaca karakter tunggal **`:`**:
1. **`SingleColonSymbol = ':'`**: Digunakan untuk:
   - Pemisah guard middleware: `auth:sanctum`
   - Pemisah parameter validasi: `unique:users,email`, `max:255`, `min:6`
   - Type return method: `authorize(): bool`
   - Ternary: `$cond ? $a : $b`
2. **`DoubleColonSymbol = '::'`**: Terbentuk jika kursor melihat `:` kedua secara berurutan:
   - Pemanggilan facade rute: `Route::post`
   - Scope resolution kelas: `AuthController::class`

---

## 2. Berkas Sumber 0: `packages/core/src/compiler/scanner/lexer/phpLexicalSymbols.ts`

> **Status**: Diterapkan (51 baris, $\le 100$ baris per Rule 14).

```typescript
/** Pembatas kurung dalam PHP. */
export type BracketSymbol = '[' | ']' | '(' | ')' | '{' | '}';

/** Tanda baca pemisah instruksi dan argumen. */
export type SeparatorSymbol = ';' | ',' | '.';

/** Titik dua tunggal ':' (pemisah middleware guard auth:sanctum, rule unique:users,email). */
export type SingleColonSymbol = ':';

/** Titik dua ganda '::' (scope resolution Route::post, AuthController::class). */
export type DoubleColonSymbol = '::';

/** Keluarga simbol titik dua dalam PHP. */
export type ColonLexeme = SingleColonSymbol | DoubleColonSymbol;

/** Operator akses member, nullsafe, dan array associative mapping. */
export type ArrowOperatorSymbol = '->' | '?->' | '=>';

/** Penyatuan seluruh tanda baca & operator leksikal. */
export type PunctuationLexeme =
    | BracketSymbol
    | SeparatorSymbol
    | ColonLexeme
    | ArrowOperatorSymbol;

/** Kata kunci bawaan PHP yang sah di level scanner. */
export type PhpKeyword = 'class' | 'function' | 'return' | 'use' | 'namespace';

/** Kata kunci spesifik framework Laravel yang sah di routes/api.php. */
export type LaravelKeyword = 'Route' | 'group' | 'middleware' | 'prefix';

/** Penyatuan kata kunci leksikal yang dikenali. */
export type KeywordLexeme = PhpKeyword | LaravelKeyword;

/** Tipe tanda kutip string literal. */
export type QuoteKind = 'single' | 'double';

/** Kategori token leksikal pada scanner. */
export type TokenType =
    | 'STRING' | 'NUMBER' | 'TRUE' | 'FALSE' | 'NULL' | 'IDENTIFIER' | 'VARIABLE'
    | 'ARROW' | 'DOUBLE_COLON' | 'OBJECT_OPERATOR' | 'NULLSAFE_OPERATOR' | 'PUNCTUATION' | 'EOF';
```

---

## 3. Berkas Sumber 1: `packages/core/src/compiler/scanner/lexer/phpAstTypes.ts`

> **Status**: Diterapkan (97 baris, $\le 100$ baris per Rule 14, 0 `?:`, 0 Fake Branding).

```typescript
import type { TokenType, PunctuationLexeme, KeywordLexeme } from "./phpLexicalSymbols";
export type { TokenType, PunctuationLexeme, KeywordLexeme };
export type { SingleColonSymbol, DoubleColonSymbol, ColonLexeme } from "./phpLexicalSymbols";

export class SourcePosition {
    private constructor(readonly line: number, readonly column: number, readonly offset: number) {
        Object.freeze(this);
    }
    static create(line: number, column: number, offset: number): SourcePosition {
        return new SourcePosition(Math.max(1, line), Math.max(0, column), Math.max(0, offset));
    }
}

export class SourceSpan {
    private constructor(readonly start: SourcePosition, readonly end: SourcePosition, readonly length: number) {
        Object.freeze(this);
    }
    static create(start: SourcePosition, end: SourcePosition): SourceSpan {
        return new SourceSpan(start, end, Math.max(0, end.offset - start.offset));
    }
}

export interface TokenDescriptor {
    readonly type: TokenType;
    readonly text: string;
    readonly span: SourceSpan;
}

export interface AstIdentifierNode {
    readonly kind: 'identifier';
    readonly name: string;
    readonly span: SourceSpan;
}
export type AstIdentifier = AstIdentifierNode;

export const createAstIdentifier = (name: string, span: SourceSpan): AstIdentifierNode => {
    if (name.length === 0) throw new Error('AST identifier cannot be empty');
    return Object.freeze({ kind: 'identifier', name, span });
};

export type PhpLiteralValue =
    | { readonly kind: 'literal'; readonly literalType: 'string'; readonly value: string }
    | { readonly kind: 'literal'; readonly literalType: 'number'; readonly value: number }
    | { readonly kind: 'literal'; readonly literalType: 'boolean'; readonly value: boolean }
    | { readonly kind: 'literal'; readonly literalType: 'null'; readonly value: null };

export interface PhpPropertyPath {
    readonly root: AstIdentifierNode;
    readonly steps: readonly AstIdentifierNode[];
}

export type PhpArgument =
    | { readonly kind: 'positional'; readonly value: PhpAstValue }
    | { readonly kind: 'named'; readonly name: AstIdentifierNode; readonly value: PhpAstValue }
    | { readonly kind: 'unpacked'; readonly value: PhpAstValue };

export interface PhpParameter { readonly variable: AstIdentifierNode; }
export type PhpClosureCapture =
    | { readonly kind: 'by_value'; readonly variable: AstIdentifierNode }
    | { readonly kind: 'by_reference'; readonly variable: AstIdentifierNode };

export type NullsafeModality = { readonly isNullsafe: true } | { readonly isNullsafe: false };

export type PhpAstValue =
    | PhpLiteralValue
    | { readonly kind: 'resource_single'; readonly resourceName: AstIdentifierNode; readonly argument: PhpAstValue }
    | { readonly kind: 'resource_collection'; readonly resourceName: AstIdentifierNode; readonly argument: PhpAstValue }
    | { readonly kind: 'method_chain'; readonly target: PhpPropertyPath; readonly receiver: PhpAstValue; readonly property: AstIdentifierNode; readonly arguments: readonly PhpAstValue[]; readonly argumentDescriptors: readonly PhpArgument[]; readonly nullsafe: NullsafeModality }
    | { readonly kind: 'property_access'; readonly target: PhpPropertyPath; readonly receiver: PhpAstValue; readonly property: AstIdentifierNode; readonly nullsafe: NullsafeModality }
    | { readonly kind: 'variable_reference'; readonly name: AstIdentifierNode }
    | { readonly kind: 'ternary_expression'; readonly condition: PhpAstValue; readonly trueBranch: PhpAstValue; readonly falseBranch: PhpAstValue }
    | { readonly kind: 'nested_array'; readonly entries: readonly PhpArrayEntry[] }
    | { readonly kind: 'static_call'; readonly className: AstIdentifierNode; readonly method: AstIdentifierNode; readonly arguments: readonly PhpAstValue[]; readonly argumentDescriptors: readonly PhpArgument[] }
    | { readonly kind: 'class_reference'; readonly className: AstIdentifierNode }
    | { readonly kind: 'closure'; readonly parameters: readonly PhpParameter[]; readonly captures: readonly PhpClosureCapture[]; readonly body: PhpBlock }
    | { readonly kind: 'arrow_function'; readonly parameters: readonly PhpParameter[]; readonly body: PhpAstValue }
    | { readonly kind: 'unsupported'; readonly reason: 'unclassified_expression'; readonly tokens: readonly TokenDescriptor[] };

export type PhpStatement =
    | { readonly kind: 'expression_statement'; readonly expression: PhpAstValue }
    | { readonly kind: 'return_statement'; readonly expression: PhpAstValue };

export interface PhpBlock { readonly kind: 'block'; readonly statements: readonly PhpStatement[]; }
export type PhpArrayKey = { readonly kind: 'literal_key'; readonly identifier: AstIdentifierNode } | { readonly kind: 'expression_key'; readonly expression: PhpAstValue };
export interface PhpArrayEntry { readonly key: PhpArrayKey; readonly value: PhpAstValue; }
export interface ParsedPhpArrayResult { readonly entries: readonly PhpArrayEntry[]; readonly endIndex: number; }
```

---

## 4. Berkas Sumber 2: `packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts`

> **Status**: Diterapkan (79 baris, $\le 100$ baris per Rule 14, 0 `if`, 0 Fake Branding).

```typescript
import type { AstIdentifierNode, SourceSpan } from "../phpAstTypes";

export type LaravelRouteMethod =
  | "get" | "post" | "put" | "patch" | "delete"
  | "options" | "head" | "match" | "any" | "apiResource";

export interface ClassReferenceNode {
  readonly kind: "class_reference";
  readonly className: AstIdentifierNode;
  readonly span: SourceSpan;
}

export interface ControllerActionPairNode {
  readonly kind: "controller_action_pair";
  readonly controller: ClassReferenceNode;
  readonly actionMethod: AstIdentifierNode;
  readonly span: SourceSpan;
}

export type RouteTargetAst =
  | ControllerActionPairNode
  | { readonly kind: "invokable_controller"; readonly controller: ClassReferenceNode; readonly span: SourceSpan }
  | { readonly kind: "inline_closure"; readonly action: AstIdentifierNode; readonly span: SourceSpan };

export interface RouteTargetVisitor<R> {
  readonly controller_action_pair: (node: ControllerActionPairNode) => R;
  readonly invokable_controller: (node: { readonly kind: "invokable_controller"; readonly controller: ClassReferenceNode; readonly span: SourceSpan }) => R;
  readonly inline_closure: (node: { readonly kind: "inline_closure"; readonly action: AstIdentifierNode; readonly span: SourceSpan }) => R;
}

export const matchRouteTarget = <R>(target: RouteTargetAst, visitor: RouteTargetVisitor<R>): R =>
  visitor[target.kind](target as never);

export type ParameterModality = { readonly kind: "required" } | { readonly kind: "optional" };

export interface RouteParameterAst {
  readonly name: AstIdentifierNode;
  readonly modality: ParameterModality;
  readonly span: SourceSpan;
}

export type PathSegmentAst =
  | { readonly kind: "static_segment"; readonly literal: AstIdentifierNode }
  | { readonly kind: "parameter_segment"; readonly parameter: RouteParameterAst };

export interface RoutePathPatternAst {
  readonly segments: readonly PathSegmentAst[];
  readonly parameters: readonly RouteParameterAst[];
  readonly span: SourceSpan;
}
export type RoutePathLiteralAst = RoutePathPatternAst;

export type RouteMiddlewareAst =
  | { readonly kind: "auth_sanctum"; readonly guard: "sanctum"; readonly span: SourceSpan }
  | { readonly kind: "admin_role"; readonly span: SourceSpan }
  | { readonly kind: "custom"; readonly identifier: AstIdentifierNode; readonly span: SourceSpan };
export type MiddlewareNameAst = RouteMiddlewareAst;

export interface RoutePrefixAst { readonly prefix: AstIdentifierNode; readonly span: SourceSpan; }

export interface RouteDeclarationAst {
  readonly method: LaravelRouteMethod;
  readonly targetMethods: readonly LaravelRouteMethod[];
  readonly path: RoutePathPatternAst;
  readonly target: RouteTargetAst;
  readonly prefix: readonly RoutePrefixAst[];
  readonly middleware: readonly RouteMiddlewareAst[];
  readonly source: SourceSpan;
}
```

---

## 5. Berkas Sumber 3: `packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts`

> **Status**: Diterapkan (45 baris, $\le 100$ baris per Rule 14, 0 `?:`, 0 Fake Branding).

```typescript
import type { AstIdentifierNode, SourceSpan } from "./phpAstTypes";

export type ValidationRuleAst =
    | { readonly kind: 'rule_modality'; readonly rule: 'required' | 'sometimes' | 'nullable' | 'required_with'; readonly span: SourceSpan }
    | { readonly kind: 'rule_type'; readonly expectedType: 'string' | 'integer' | 'array' | 'boolean'; readonly span: SourceSpan }
    | { readonly kind: 'rule_bound'; readonly boundType: 'min' | 'max'; readonly limit: number; readonly span: SourceSpan }
    | { readonly kind: 'rule_database'; readonly constraint: 'exists' | 'unique'; readonly table: AstIdentifierNode; readonly column: AstIdentifierNode; readonly span: SourceSpan }
    | { readonly kind: 'rule_format'; readonly format: 'email' | 'uuid'; readonly span: SourceSpan }
    | { readonly kind: 'rule_custom'; readonly rawName: AstIdentifierNode; readonly span: SourceSpan };
export type ValidationRuleLiteralAst = ValidationRuleAst;

export interface InlineValidationAst {
    readonly field: AstIdentifierNode;
    readonly rules: readonly ValidationRuleAst[];
    readonly source: SourceSpan;
}

export type HttpErrorCode = 400 | 401 | 403 | 404 | 409 | 422 | 500;

export interface HttpErrorStatusAst {
    readonly code: HttpErrorCode;
    readonly reasonPhrase: 'Unauthorized' | 'Forbidden' | 'NotFound' | 'UnprocessableEntity' | 'ServerError';
    readonly span: SourceSpan;
}

export interface ControllerErrorAst {
    readonly status: HttpErrorStatusAst;
    readonly source: SourceSpan;
}

export interface ControllerBodyAst {
    readonly validations: readonly InlineValidationAst[];
    readonly errors: readonly ControllerErrorAst[];
}
```
