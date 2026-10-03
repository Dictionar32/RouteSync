/**
 * Declarative grammar relation dispatcher.
 *
 * Grammar meaning is selected through a typed relation table. The adapter does
 * not contain source-construct control statements; unsupported forms become
 * boundary diagnostics through the fallback relation.
 */
import type {
  PhpGrammarNode,
  GrammarPropertyLookup,
  GrammarNullsafeLookup,
  GrammarOffsetLookup,
  GrammarStaticLookup,
  GrammarCall,
  GrammarNew,
  GrammarClosure,
  GrammarArrowFunc,
  GrammarBin,
  GrammarUnary,
  GrammarCast,
  GrammarRetif,
  GrammarArray,
  GrammarString,
  GrammarNumber,
  GrammarBoolean,
  GrammarNull,
  GrammarEncapsed,
  GrammarVariable,
  GrammarUnknown,
} from './grammar';

export interface PhpGrammarVisitor<R> {
  readonly propertylookup: (node: GrammarPropertyLookup) => R;
  readonly nullsafepropertylookup: (node: GrammarNullsafeLookup) => R;
  readonly offsetlookup: (node: GrammarOffsetLookup) => R;
  readonly staticlookup: (node: GrammarStaticLookup) => R;
  readonly call: (node: GrammarCall) => R;
  readonly new: (node: GrammarNew) => R;
  readonly closure: (node: GrammarClosure) => R;
  readonly arrowfunc: (node: GrammarArrowFunc) => R;
  readonly bin: (node: GrammarBin) => R;
  readonly unary: (node: GrammarUnary) => R;
  readonly cast: (node: GrammarCast) => R;
  readonly retif: (node: GrammarRetif) => R;
  readonly array: (node: GrammarArray) => R;
  readonly string: (node: GrammarString) => R;
  readonly number: (node: GrammarNumber) => R;
  readonly boolean: (node: GrammarBoolean) => R;
  readonly nullkeyword: (node: GrammarNull) => R;
  readonly encapsed: (node: GrammarEncapsed) => R;
  readonly variable: (node: GrammarVariable) => R;
  readonly unknown: (node: GrammarUnknown) => R;
}

type GrammarKind = PhpGrammarNode['kind'];
type GrammarDispatch<R> = Readonly<Record<GrammarKind, (node: PhpGrammarNode) => R>>;

const unsupportedGrammarNode = <R>(): ((node: PhpGrammarNode) => R) =>
  node => { throw Error(`PHP AST grammar matcher: ${node.kind} is not an expression node`); };

const dispatch = <R>(visitor: PhpGrammarVisitor<R>): GrammarDispatch<R> => Object.freeze({
  propertylookup: node => visitor.propertylookup(node as GrammarPropertyLookup),
  nullsafepropertylookup: node => visitor.nullsafepropertylookup(node as GrammarNullsafeLookup),
  offsetlookup: node => visitor.offsetlookup(node as GrammarOffsetLookup),
  staticlookup: node => visitor.staticlookup(node as GrammarStaticLookup),
  call: node => visitor.call(node as GrammarCall),
  new: node => visitor.new(node as GrammarNew),
  closure: node => visitor.closure(node as GrammarClosure),
  arrowfunc: node => visitor.arrowfunc(node as GrammarArrowFunc),
  bin: node => visitor.bin(node as GrammarBin),
  unary: node => visitor.unary(node as GrammarUnary),
  cast: node => visitor.cast(node as GrammarCast),
  retif: node => visitor.retif(node as GrammarRetif),
  array: node => visitor.array(node as GrammarArray),
  string: node => visitor.string(node as GrammarString),
  number: node => visitor.number(node as GrammarNumber),
  boolean: node => visitor.boolean(node as GrammarBoolean),
  nullkeyword: node => visitor.nullkeyword(node as GrammarNull),
  encapsed: node => visitor.encapsed(node as GrammarEncapsed),
  variable: node => visitor.variable(node as GrammarVariable),
  unknown: node => visitor.unknown(node as GrammarUnknown),
  identifier: unsupportedGrammarNode<R>(),
  name: unsupportedGrammarNode<R>(),
  selfreference: unsupportedGrammarNode<R>(),
  staticreference: unsupportedGrammarNode<R>(),
  entry: unsupportedGrammarNode<R>(),
});

export function matchPhpGrammar<R>(node: PhpGrammarNode, visitor: PhpGrammarVisitor<R>): R {
  return dispatch(visitor)[node.kind](node);
}
