/**
 * phpLexicalSymbols.ts
 *
 * Atomic lexical symbols, punctuation lexemes, and keywords for PHP & Laravel.
 * Trace-verified against toko-online syntax (single ':', double '::', brackets, arrows).
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/compiler/scanner/lexer/phpLexicalSymbols
 */

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
    | 'ARROW' | 'DOUBLE_COLON' | 'OBJECT_OPERATOR' | 'NULLSAFE_OPERATOR' | 'QUESTION' | 'COLON' | 'ASSIGN' | 'EQUAL' | 'IDENTICAL' | 'NOT_EQUAL' | 'NOT_IDENTICAL'
    | 'NULL_COALESCE' | 'SHORT_TERNARY' | 'NULL_COALESCE_ASSIGN' | 'CONCAT' | 'ELLIPSIS' | 'PUNCTUATION' | 'EOF';
