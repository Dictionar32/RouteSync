import { createHash } from 'crypto';

export enum PrimitiveKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATETIME = 'datetime',
  UNKNOWN = 'unknown'
}

export enum CollectionKind {
  ARRAY = 'array',
  COLLECTION = 'collection',
  NULLABLE = 'nullable'
}

export interface FileSpan {
  readonly filePath: string;
  readonly start: number;
  readonly length: number;
  readonly line: number;
  readonly column: number;
}

export interface ASTBaseNode {
  readonly span: FileSpan;
}

export class ClassDeclaration implements ASTBaseNode {
  readonly kind = 'ClassDeclaration';
  constructor(readonly span: FileSpan, readonly name: string) {}
}

export class MethodDeclaration implements ASTBaseNode {
  readonly kind = 'MethodDeclaration';
  constructor(readonly span: FileSpan, readonly name: string) {}
}

export class PropertyDeclaration implements ASTBaseNode {
  readonly kind = 'PropertyDeclaration';
  constructor(readonly span: FileSpan, readonly name: string) {}
}

export class CallExpression implements ASTBaseNode {
  readonly kind = 'CallExpression';
  constructor(readonly span: FileSpan, readonly callee: string) {}
}

export type ASTNode =
  | ClassDeclaration
  | MethodDeclaration
  | PropertyDeclaration
  | CallExpression;

export interface SymbolReference {
  readonly symbolId: number;
  readonly span: FileSpan;
}

export interface BoundASTNode extends ASTBaseNode {
  readonly kind: 'BoundASTNode';
  readonly symbolId: number;
  readonly resolvedType: SemanticType;
  readonly scopeId: number;
  readonly references: readonly SymbolReference[];
  readonly children: readonly BoundASTNode[];
}

const artifactBrand: unique symbol = Symbol('artifactBrand');

export abstract class CompilerArtifact {
  private readonly __brand: typeof artifactBrand = artifactBrand;
  public abstract readonly typeId: ArtifactKey;
  public abstract readonly metadata: ArtifactMetadata;
}

export abstract class TypedArtifact<K extends ArtifactKey> extends CompilerArtifact {
  public abstract readonly typeId: K;
}

export interface ArtifactMetadata {
  readonly hash: string;
  readonly producer: string;
  readonly dependencies: readonly string[];
  readonly timestamp: number;
  readonly revision: string;
}

export class ASTArtifact extends TypedArtifact<'AST'> {
  public readonly typeId = 'AST';
  constructor(
    public readonly root: ASTNode,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export interface ScopeNode {
  readonly scopeId: number;
  readonly parentId?: number;
  readonly bindings: ReadonlyMap<string, number>;
}

export class ScopeGraphArtifact extends TypedArtifact<'ScopeGraph'> {
  public readonly typeId = 'ScopeGraph';
  constructor(
    public readonly scopes: ReadonlyMap<number, ScopeNode>,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class BoundASTArtifact extends TypedArtifact<'BoundAST'> {
  public readonly typeId = 'BoundAST';
  constructor(
    public readonly root: BoundASTNode,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export interface Symbol {
  readonly name: string;
  readonly kind: 'class' | 'method' | 'property';
  readonly type?: SemanticType;
}

export interface SymbolTable {
  readonly symbols: ReadonlyMap<string, Symbol>;
}

export class SymbolGraphArtifact extends TypedArtifact<'SymbolGraph'> {
  public readonly typeId = 'SymbolGraph';
  constructor(
    public readonly symbols: SymbolTable,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class ConstraintGraphArtifact extends TypedArtifact<'ConstraintGraph'> {
  public readonly typeId = 'ConstraintGraph';
  constructor(
    public readonly constraints: readonly Constraint[],
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class TypeEnvironmentArtifact extends TypedArtifact<'TypeEnvironment'> {
  public readonly typeId = 'TypeEnvironment';
  constructor(
    public readonly environment: TypeEnvironment,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class ExpressionIRArtifact extends TypedArtifact<'ExpressionIR'> {
  public readonly typeId = 'ExpressionIR';
  constructor(
    public readonly expressions: ReadonlyMap<string, Expression>,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class LoweredTypeArtifact extends TypedArtifact<'LoweredTypeGraph'> {
  public readonly typeId = 'LoweredTypeGraph';
  constructor(
    public readonly types: ReadonlyMap<string, SemanticType>,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class DiagnosticArtifact extends TypedArtifact<'DiagnosticSnapshot'> {
  public readonly typeId = 'DiagnosticSnapshot';
  constructor(
    public readonly diagnostics: DiagnosticBag,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class DependencyGraphArtifact extends TypedArtifact<'DependencyGraph'> {
  public readonly typeId = 'DependencyGraph';
  constructor(
    public readonly graph: DependencyGraph,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class SemanticIRArtifact extends TypedArtifact<'SemanticIR'> {
  public readonly typeId = 'SemanticIR';
  constructor(
    public readonly rootNodes: readonly SemanticIRNode[],
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class ContractGraphArtifact extends TypedArtifact<'ContractGraph'> {
  public readonly typeId = 'ContractGraph';
  constructor(
    public readonly graph: ContractGraph,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export class CompilationResultArtifact extends TypedArtifact<'CompilationResult'> {
  public readonly typeId = 'CompilationResult';
  constructor(
    public readonly result: CompilationResult,
    public readonly metadata: ArtifactMetadata
  ) {
    super();
  }
}

export interface ArtifactRegistry {
  AST: ASTArtifact;
  ScopeGraph: ScopeGraphArtifact;
  BoundAST: BoundASTArtifact;
  SymbolGraph: SymbolGraphArtifact;
  ConstraintGraph: ConstraintGraphArtifact;
  TypeEnvironment: TypeEnvironmentArtifact;
  ExpressionIR: ExpressionIRArtifact;
  LoweredTypeGraph: LoweredTypeArtifact;
  DiagnosticSnapshot: DiagnosticArtifact;
  DependencyGraph: DependencyGraphArtifact;
  SemanticIR: SemanticIRArtifact;
  ContractGraph: ContractGraphArtifact;
  CompilationResult: CompilationResultArtifact;
}

export type ArtifactKey = keyof ArtifactRegistry;

export type ArtifactStorage = {
  [K in ArtifactKey]?: ArtifactRegistry[K];
};

export interface PassDescriptor {
  readonly consumes: readonly ArtifactKey[];
  readonly produces: readonly ArtifactKey[];
}

export class ArtifactKeyWitness<K extends ArtifactKey> {
  constructor(public readonly key: K) {}
  public read(state: CompilationState): ArtifactRegistry[K] {
    return state.require(this);
  }
}

export type ResolveArtifacts<T extends readonly ArtifactKey[]> = {
  [K in keyof T]: T[K] extends ArtifactKey
    ? ArtifactRegistry[T[K]]
    : never;
};

export function readArtifacts<K extends readonly ArtifactKey[]>(
  witnesses: { [I in keyof K]: ArtifactKeyWitness<K[I]> },
  state: CompilationState
): ResolveArtifacts<K> {
  // SAFETY:
  // Array.prototype.map widens tuples to arrays. Each witness produces the
  // value corresponding to its ArtifactKey, preserving order and cardinality.
  const list = witnesses as readonly ArtifactKeyWitness<ArtifactKey>[];
  return list.map(w => w.read(state)) as ResolveArtifacts<K>;
}

export interface PassDependency {
  readonly producer?: string;
  readonly artifact: ArtifactKey;
}

export interface CompilerPass<
  I extends readonly ArtifactKey[],
  O extends readonly ArtifactKey[]
> {
  readonly name: string;
  readonly inputWitnesses: { [K in keyof I]: ArtifactKeyWitness<I[K]> };
  readonly outputKeys: O;
  readonly descriptor: PassDescriptor;
  readonly requires: readonly PassDependency[];
  readonly producesPass: readonly string[];
  run(inputs: ResolveArtifacts<I>, context: CompilationContext): ResolveArtifacts<O> | Promise<ResolveArtifacts<O>>;
}

export interface ExecutablePass {
  readonly name: string;
  readonly descriptor: PassDescriptor;
  readonly requires: readonly PassDependency[];
  execute(state: CompilationState, context: CompilationContext, cache?: ArtifactCache): Promise<CompilationState>;
}

export class TypedPassAdapter<
  I extends readonly ArtifactKey[],
  O extends readonly ArtifactKey[]
> implements ExecutablePass {
  constructor(private readonly pass: CompilerPass<I, O>) {}

  public get name(): string { return this.pass.name; }
  public get descriptor(): PassDescriptor { return this.pass.descriptor; }
  public get requires(): readonly PassDependency[] { return this.pass.requires; }

  public async execute(
    state: CompilationState,
    context: CompilationContext,
    cache?: ArtifactCache
  ): Promise<CompilationState> {
    const inputs = readArtifacts(this.pass.inputWitnesses, state);
    const inputsArray = inputs as readonly CompilerArtifact[];
    const witnesses = this.pass.inputWitnesses as readonly ArtifactKeyWitness<ArtifactKey>[];
    
    let descriptor: CacheDescriptor | undefined;
    if (cache) {
      const fingerprint = context.getFingerprint();
      descriptor = {
        passName: this.name,
        inputs: witnesses.map((w, index) => ({
          artifactKey: w.key,
          inputHash: inputsArray[index]!.metadata.hash
        })),
        compilerVersion: fingerprint.compilerVersion,
        optionsHash: computeFingerprintHash(fingerprint)
      };
      
      const cachedOutputs = cache.get(descriptor) as ResolveArtifacts<O> | undefined;
      if (cachedOutputs) {
        return this.applyOutputs(state, cachedOutputs);
      }
    }

    const outputs = await this.pass.run(inputs, context);
    const nextState = this.applyOutputs(state, outputs);
    
    if (cache && descriptor) {
      cache.set(descriptor, outputs as any);
    }
    return nextState;
  }

  private applyOutputs(state: CompilationState, outputs: ResolveArtifacts<O>): CompilationState {
    const outputsArray = outputs as readonly CompilerArtifact[];
    let nextState = state;
    for (let i = 0; i < this.pass.outputKeys.length; i++) {
      const key = this.pass.outputKeys[i]!;
      nextState = nextState.put(key, outputsArray[i] as any);
    }
    return nextState;
  }
}

export class CompilationState {
  private constructor(private readonly artifacts: Readonly<ArtifactStorage>) {}

  public static empty(): CompilationState {
    return new CompilationState({});
  }

  public put<K extends ArtifactKey>(key: K, value: ArtifactRegistry[K]): CompilationState {
    return new CompilationState({
      ...this.artifacts,
      [key]: value
    });
  }

  public merge(other: CompilationState): CompilationState {
    return new CompilationState({
      ...this.artifacts,
      ...other.artifacts
    });
  }

  public require<K extends ArtifactKey>(witness: ArtifactKeyWitness<K>): ArtifactRegistry[K] {
    const value = this.artifacts[witness.key];
    if (!value) {
      throw new Error(`Missing artifact: ${witness.key}`);
    }
    return value;
  }
}

export type ArtifactOriginKind = 'source' | 'pass' | 'cache';
export interface ArtifactOrigin {
  readonly kind: ArtifactOriginKind;
  readonly producerName?: string;
}

export interface ArtifactEdge {
  readonly producer: string;
  readonly artifact: ArtifactKey;
  readonly consumer: string;
}

export class PassGraph {
  public static buildAdjacency(passes: readonly ExecutablePass[]): Map<ArtifactKey, Set<ExecutablePass>> {
    const map = new Map<ArtifactKey, Set<ExecutablePass>>();
    for (const pass of passes) {
      for (const req of pass.descriptor.consumes) {
        const set = map.get(req) ?? new Set();
        set.add(pass);
        map.set(req, set);
      }
    }
    return map;
  }

  public static resolve(
    passes: readonly ExecutablePass[],
    externalInputs: readonly ArtifactKey[] = []
  ): readonly ExecutablePass[] {
    const adj = this.buildAdjacency(passes);
    const indegree = new Map<string, number>();
    const nodeMap = new Map<string, ExecutablePass>();

    const producers = new Map<ArtifactKey, string>();
    for (const pass of passes) {
      for (const prod of pass.descriptor.produces) {
        if (producers.has(prod)) {
          throw new Error(`Multiple producers detected for artifact: ${prod} (owned by ${producers.get(prod)} and ${pass.name})`);
        }
        producers.set(prod, pass.name);
      }
    }

    const allAvailable = new Set<ArtifactKey>(externalInputs);
    for (const p of passes) {
      for (const prod of p.descriptor.produces) {
        allAvailable.add(prod);
      }
    }
    for (const p of passes) {
      for (const consume of p.descriptor.consumes) {
        if (!allAvailable.has(consume)) {
          throw new Error(`Missing provider for artifact: ${consume} consumed by ${p.name}`);
        }
      }
    }

    for (const pass of passes) {
      nodeMap.set(pass.name, pass);
      
      const internalConsumes = pass.descriptor.consumes.filter(c => 
        passes.some(p => p !== pass && p.descriptor.produces.includes(c))
      );
      indegree.set(pass.name, internalConsumes.length);
    }

    const queue = Array.from(indegree.entries())
      .filter(([_, v]) => v === 0)
      .map(([k]) => k);

    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      const currentPass = nodeMap.get(current)!;
      for (const prod of currentPass.descriptor.produces) {
        const dependents = adj.get(prod) ?? new Set();
        for (const dep of dependents) {
          const nextVal = (indegree.get(dep.name) ?? 0) - 1;
          indegree.set(dep.name, nextVal);
          if (nextVal === 0) {
            queue.push(dep.name);
          }
        }
      }
    }

    if (result.length !== passes.length) {
      throw new Error('Compiler pass cycle detected');
    }

    return result.map(name => nodeMap.get(name)!);
  }

  public static resolveLayers(
    passes: readonly ExecutablePass[],
    externalInputs: readonly ArtifactKey[] = []
  ): readonly (readonly ExecutablePass[])[] {
    const adj = this.buildAdjacency(passes);
    const indegree = new Map<string, number>();
    const nodeMap = new Map<string, ExecutablePass>();

    for (const pass of passes) {
      nodeMap.set(pass.name, pass);
      const internalConsumes = pass.descriptor.consumes.filter(c => 
        passes.some(p => p !== pass && p.descriptor.produces.includes(c))
      );
      indegree.set(pass.name, internalConsumes.length);
    }

    const layers: ExecutablePass[][] = [];
    const remaining = new Set<string>(nodeMap.keys());

    while (remaining.size > 0) {
      const currentLayer = Array.from(remaining.values())
        .filter(name => (indegree.get(name) ?? 0) === 0)
        .map(name => nodeMap.get(name)!);

      if (currentLayer.length === 0) {
        throw new Error('Compiler pass cycle detected');
      }

      layers.push(currentLayer);
      for (const pass of currentLayer) {
        remaining.delete(pass.name);
        for (const prod of pass.descriptor.produces) {
          const dependents = adj.get(prod) ?? new Set();
          for (const dep of dependents) {
            const val = indegree.get(dep.name) ?? 0;
            indegree.set(dep.name, Math.max(0, val - 1));
          }
        }
      }
    }

    return layers;
  }
}

export class PassManager {
  private passes: ExecutablePass[] = [];
  constructor(private readonly externalInputs: readonly ArtifactKey[] = []) {}

  public registerPass<I extends readonly ArtifactKey[], O extends readonly ArtifactKey[]>(
    pass: CompilerPass<I, O>
  ): void {
    this.passes.push(new TypedPassAdapter(pass));
    this.passes = [...PassGraph.resolve(this.passes, this.externalInputs)];
  }

  public async execute<K extends keyof ArtifactRegistry>(
    key: K,
    initialInput: ArtifactRegistry[K]
  ): Promise<CompilationResult> {
    let state = CompilationState.empty().put(key, initialInput);
    
    const context = CompilationContext.default();
    const layers = PassGraph.resolveLayers(this.passes, this.externalInputs);
    for (const layer of layers) {
      const nextStates = await Promise.all(
        layer.map(pass => pass.execute(state, context))
      );
      for (const ns of nextStates) {
        state = state.merge(ns);
      }
    }
    return state.require(new ArtifactKeyWitness('CompilationResult')).result;
  }
}

export class ImmutableMap<K, V> {
  #data: Map<K, V>;

  constructor(source: ReadonlyMap<K, V>) {
    this.#data = new Map(source);
  }

  public get(key: K): V | undefined {
    return this.#data.get(key);
  }

  public entries(): readonly (readonly [K, V])[] {
    return Object.freeze(
      Array.from(this.#data.entries()).map(e => Object.freeze([e[0], e[1]]) as readonly [K, V])
    );
  }
}

export class ImmutableSet<T> {
  #data: Set<T>;

  constructor(source: ReadonlySet<T>) {
    this.#data = new Set(source);
  }

  public has(value: T): boolean {
    return this.#data.has(value);
  }

  public values(): readonly T[] {
    return Object.freeze(Array.from(this.#data.values()));
  }
}

const semanticTypeBrand: unique symbol = Symbol('semanticTypeBrand');

export abstract class SemanticTypeBase {
  protected readonly [semanticTypeBrand] = true;
}

export class PrimitiveType extends SemanticTypeBase {
  readonly kind = 'primitive';
  constructor(readonly type: PrimitiveKind) { super(); }
}

export class NeverType extends SemanticTypeBase {
  readonly kind = 'never';
}

export class ErrorType extends SemanticTypeBase {
  readonly kind = 'error';
  constructor(readonly diagnosticMessage: string) { super(); }
}

export class ReferenceType extends SemanticTypeBase {
  readonly kind = 'reference';
  constructor(readonly namespace: string, readonly name: string) { super(); }
}

export class UnionType extends SemanticTypeBase {
  readonly kind = 'union';
  constructor(readonly members: ImmutableSet<SemanticType>) { super(); }
}

export class IntersectionType extends SemanticTypeBase {
  readonly kind = 'intersection';
  constructor(readonly members: ImmutableSet<SemanticType>) { super(); }
}

export class ReadonlyCollectionType extends SemanticTypeBase {
  readonly kind = 'readonly_collection';
  constructor(readonly collectionKind: CollectionKind, readonly elementType: SemanticType) { super(); }
}

export class MutableCollectionType extends SemanticTypeBase {
  readonly kind = 'mutable_collection';
  constructor(readonly collectionKind: CollectionKind, readonly elementType: SemanticType) { super(); }
}

export type GenericVariance = 'covariant' | 'contravariant' | 'invariant';

export interface GenericParameter {
  readonly name: string;
  readonly variance: GenericVariance;
  readonly type: SemanticType;
}

export class GenericType extends SemanticTypeBase {
  readonly kind = 'generic';
  constructor(readonly base: ReferenceType, readonly parameters: readonly GenericParameter[]) { super(); }
}

export class ObjectType extends SemanticTypeBase {
  readonly kind = 'object';
  constructor(
    readonly properties: ImmutableMap<string, SemanticType>,
    readonly requiredProperties: ImmutableSet<string>,
    readonly baseObject?: SemanticType,
    readonly interfaces?: readonly SemanticType[],
    readonly annotations?: ImmutableMap<string, string>
  ) { super(); }
}

export type SemanticType =
  | PrimitiveType
  | NeverType
  | ErrorType
  | ReferenceType
  | UnionType
  | IntersectionType
  | ReadonlyCollectionType
  | MutableCollectionType
  | GenericType
  | ObjectType;

export interface HashContext {
  readonly activeStack: SemanticType[];
  readonly finalized: WeakMap<SemanticType, string>;
}

export class TypeHasher {
  public static hash(type: SemanticType, context: HashContext): string {
    const final = context.finalized.get(type);
    if (final) return final;

    const index = context.activeStack.indexOf(type);
    if (index !== -1) {
      const distance = context.activeStack.length - index;
      return `ref^${distance}`;
    }

    context.activeStack.push(type);
    const baseHash = this.computeHash(type, context);
    context.activeStack.pop();

    context.finalized.set(type, baseHash);
    return baseHash;
  }

  private static computeHash(type: SemanticType, context: HashContext): string {
    switch (type.kind) {
      case 'primitive':
        return `primitive:${type.type}`;
      case 'never':
        return 'never';
      case 'error':
        return `error:${type.diagnosticMessage}`;
      case 'reference':
        return `reference:${type.namespace}\\${type.name}`;
      case 'readonly_collection':
        return `readonly_collection:${type.collectionKind}<${this.hash(type.elementType, context)}>`;
      case 'mutable_collection':
        return `mutable_collection:${type.collectionKind}<${this.hash(type.elementType, context)}>`;
      case 'generic':
        const paramHashes = type.parameters.map(p => `${p.name}[${p.variance}]:${this.hash(p.type, context)}`);
        return `generic:${this.hash(type.base, context)}<${paramHashes.join(',')}>`;
      case 'union':
        const hashes = Array.from(type.members.values()).map(m => this.hash(m, context)).sort();
        return `union[${hashes.join(',')}]`;
      case 'intersection':
        const interHashes = Array.from(type.members.values()).map(m => this.hash(m, context)).sort();
        return `intersection[${interHashes.join(',')}]`;
      case 'object':
        const propHashes = Array.from(type.properties.entries())
          .map(([k, v]) => `${k}:${this.hash(v, context)}`)
          .sort();
        const baseHash = type.baseObject ? this.hash(type.baseObject, context) : 'none';
        const interfaceHash = type.interfaces 
          ? type.interfaces.map(i => this.hash(i, context)).sort().join(',') 
          : 'none';
        const requiredHash = Array.from(type.requiredProperties.values()).sort().join(',');
        const annoHash = type.annotations 
          ? Array.from(type.annotations.entries()).map(([k, v]) => `${k}=${v}`).sort().join(',')
          : 'none';

        return `object{props:${propHashes.join(',')};req:${requiredHash};base:${baseHash};iface:${interfaceHash};ann:${annoHash}}`;
    }
  }
}

export class TypeInterner {
  private cache = new Map<string, SemanticType>();

  public intern(type: SemanticType): SemanticType {
    const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
    const hash = TypeHasher.hash(type, ctx);
    let cached = this.cache.get(hash);
    if (!cached) {
      cached = type;
      this.cache.set(hash, type);
    }
    return cached;
  }
}

export class LRUCache<K, V> {
  private readonly cache = new Map<K, V>();
  constructor(private readonly max: number) {}
  
  public get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  public set(key: K, value: V): void {
    if (this.cache.size >= this.max) {
      const iterator = this.cache.keys().next();
      if (!iterator.done) {
        this.cache.delete(iterator.value);
      }
    }
    this.cache.set(key, value);
  }
}

export interface TypeHierarchy {
  getParent(type: SemanticType): SemanticType | undefined;
}

export class TypeSystem {
  constructor(private readonly hierarchy: TypeHierarchy) {}

  public join(a: SemanticType, b: SemanticType): SemanticType {
    const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
    if (TypeHasher.hash(a, ctx) === TypeHasher.hash(b, ctx)) return a;
    if (a.kind === 'never') return b;
    if (b.kind === 'never') return a;
    return new UnionType(new ImmutableSet(new Set([a, b])));
  }

  public meet(a: SemanticType, b: SemanticType): SemanticType {
    const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
    if (TypeHasher.hash(a, ctx) === TypeHasher.hash(b, ctx)) return a;
    return new NeverType();
  }

  public isSubtype(source: SemanticType, target: SemanticType): boolean {
    const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
    if (target.kind === 'primitive' && target.type === PrimitiveKind.UNKNOWN) {
      return true;
    }
    if (source.kind === 'union') {
      return Array.from(source.members.values()).every(member => this.isAssignable(member, target));
    }
    if (source.kind === 'primitive' && target.kind === 'primitive') {
      return source.type === target.type;
    }
    if (source.kind === 'reference' && target.kind === 'reference') {
      const visited = new Set<string>();
      let current: SemanticType | undefined = source;
      while (current) {
        const id = current.kind === 'reference' ? `${current.namespace}\\${current.name}` : '';
        if (visited.has(id)) {
          return false;
        }
        visited.add(id);

        if (current.kind === 'reference' && current.name === target.name && current.namespace === target.namespace) {
          return true;
        }
        current = this.hierarchy.getParent(current);
      }
      return false;
    }
    if (source.kind === 'readonly_collection' && target.kind === 'readonly_collection') {
      return this.isSubtype(source.elementType, target.elementType);
    }
    if (source.kind === 'mutable_collection' && target.kind === 'mutable_collection') {
      return TypeHasher.hash(source.elementType, ctx) === TypeHasher.hash(target.elementType, ctx);
    }
    if (source.kind === 'generic' && target.kind === 'generic') {
      if (!this.isSubtype(source.base, target.base)) return false;
      for (let i = 0; i < source.parameters.length; i++) {
        const s = source.parameters[i]!;
        const t = target.parameters[i]!;
        if (s.variance === 'covariant') {
          if (!this.isSubtype(s.type, t.type)) return false;
        } else if (s.variance === 'contravariant') {
          if (!this.isSubtype(t.type, s.type)) return false;
        } else if (s.variance === 'invariant') {
          if (TypeHasher.hash(s.type, ctx) !== TypeHasher.hash(t.type, ctx)) return false;
        }
      }
      return true;
    }
    return false;
  }

  public isAssignable(source: SemanticType, target: SemanticType): boolean {
    if (this.isSubtype(source, target)) return true;
    if (target.kind === 'union') {
      return Array.from(target.members.values()).some(member => this.isAssignable(source, member));
    }
    return false;
  }
}

export interface TextEdit {
  readonly span: FileSpan;
  readonly newText: string;
}

export interface DiagnosticFix {
  readonly description: string;
  readonly edits: readonly TextEdit[];
}

export interface Diagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly location?: FileSpan;
  readonly fix?: DiagnosticFix;
}

export class DiagnosticBag {
  private constructor(private readonly items: readonly Diagnostic[] = []) {}

  public static createEmpty(): DiagnosticBag {
    return new DiagnosticBag([]);
  }

  public report(diagnostic: Diagnostic): DiagnosticBag {
    return new DiagnosticBag([...this.items, diagnostic]);
  }

  public getDiagnostics(): readonly Diagnostic[] {
    return this.items;
  }
}

export class FrozenSet<T> implements ReadonlySet<T> {
  #data: Set<T>;

  constructor(source: ReadonlySet<T>) {
    this.#data = new Set(source);
    Object.freeze(this);
  }

  public has(v: T): boolean {
    return this.#data.has(v);
  }

  public values(): IterableIterator<T> {
    return this.#data.values();
  }

  public get size(): number {
    return this.#data.size;
  }

  public forEach(
    callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void,
    thisArg?: unknown
  ): void {
    this.#data.forEach((v, v2) => callbackfn.call(thisArg, v, v2, this));
  }

  public [Symbol.iterator](): IterableIterator<T> {
    return this.#data[Symbol.iterator]();
  }

  public entries(): IterableIterator<[T, T]> {
    return this.#data.entries();
  }

  public keys(): IterableIterator<T> {
    return this.#data.keys();
  }
}

export interface DependencyGraph {
  readonly forward: ReadonlyMap<string, ReadonlySet<string>>;
  readonly reverse: ReadonlyMap<string, ReadonlySet<string>>;
}

export class DependencyGraphBuilder {
  private forward = new Map<string, Set<string>>();
  private reverse = new Map<string, Set<string>>();

  public addDependency(from: string, to: string): this {
    const forwardDeps = this.forward.get(from) || new Set();
    forwardDeps.add(to);
    this.forward.set(from, forwardDeps);

    const reverseDeps = this.reverse.get(to) || new Set();
    reverseDeps.add(from);
    this.reverse.set(to, reverseDeps);
    return this;
  }

  public build(): DependencyGraph {
    const finalForward = new Map<string, FrozenSet<string>>();
    for (const [k, v] of this.forward.entries()) finalForward.set(k, new FrozenSet(v));
    
    const finalReverse = new Map<string, FrozenSet<string>>();
    for (const [k, v] of this.reverse.entries()) finalReverse.set(k, new FrozenSet(v));

    const result = { forward: finalForward, reverse: finalReverse };
    Object.freeze(result);
    return result;
  }
}

export class IncrementalInvalidator {
  constructor(private readonly graph: DependencyGraph) {}

  public invalidate(node: string): ReadonlySet<string> {
    const affected = new Set<string>();
    const queue = [node];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const dep of this.graph.reverse.get(curr) ?? []) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }
    return new FrozenSet(affected);
  }
}

export interface ConstraintViolation {
  readonly code: string;
  readonly message: string;
  readonly location?: FileSpan;
}

export interface TypeVariable {
  readonly id: number;
  readonly name: string;
}

export type Constraint =
  | { kind: 'PropertyExists'; source: TypeVariable; property: string; expected: TypeVariable; span?: FileSpan }
  | { kind: 'Equality'; source: TypeVariable; target: TypeVariable; span?: FileSpan }
  | { kind: 'Subtype'; source: TypeVariable; target: TypeVariable; span?: FileSpan }
  | { kind: 'ReturnType'; source: TypeVariable; expected: TypeVariable; span?: FileSpan }
  | { kind: 'HasType'; source: TypeVariable; type: SemanticType; span?: FileSpan };

export class TypeEnvironment {
  constructor(private readonly bindings: ReadonlyMap<number, SemanticType> = new Map()) {}

  public bind(id: number, type: SemanticType): TypeEnvironment {
    return new TypeEnvironment(new Map([...this.bindings, [id, type]]));
  }

  public resolve(variable: number): SemanticType | undefined {
    return this.bindings.get(variable);
  }
}

export interface VariableState {
  readonly lowerBounds: Set<SemanticType>;
  readonly upperBounds: Set<SemanticType>;
}

export class UnionFind {
  private parent = new Map<number, number>();
  private rank = new Map<number, number>();

  public find(id: number): number {
    let root = id;
    while (this.parent.has(root) && this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    let curr = id;
    while (this.parent.has(curr) && this.parent.get(curr) !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  public union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;

    const rankA = this.rank.get(rootA) ?? 0;
    const rankB = this.rank.get(rootB) ?? 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }
}

export class ConstraintSolver {
  public readonly diagnostics: ConstraintViolation[] = [];

  private checkAssignability(source: SemanticType, target: SemanticType): boolean {
    const hierarchy: TypeHierarchy = { getParent: () => undefined };
    const ts = new TypeSystem(hierarchy);
    return ts.isAssignable(source, target);
  }

  private typeName(type: SemanticType): string {
    switch (type.kind) {
      case 'primitive': return type.type;
      case 'reference': return `${type.namespace}\\${type.name}`;
      case 'union': return 'union';
      default: return type.kind;
    }
  }

  public solve(constraints: readonly Constraint[]): TypeEnvironment {
    this.diagnostics.length = 0;
    let environment = new TypeEnvironment();
    const uf = new UnionFind();
    const worklist: number[] = [];
    const constraintIndex = new Map<number, Constraint[]>();
    const states = new Map<number, VariableState>();
    const neighbors = new Map<number, Set<number>>();

    for (const constraint of constraints) {
      const list = constraintIndex.get(constraint.source.id) ?? [];
      list.push(constraint);
      constraintIndex.set(constraint.source.id, list);

      if (constraint.kind === 'Subtype') {
        const srcSet = neighbors.get(constraint.source.id) ?? new Set();
        srcSet.add(constraint.target.id);
        neighbors.set(constraint.source.id, srcSet);

        const dstSet = neighbors.get(constraint.target.id) ?? new Set();
        dstSet.add(constraint.source.id);
        neighbors.set(constraint.target.id, dstSet);
      }
    }

    const vars = this.collectVariables(constraints);
    worklist.push(...vars);

    while (worklist.length > 0) {
      const variable = worklist.pop()!;
      for (const constraint of this.getAffectedConstraints(variable, constraintIndex)) {
        if (this.solveConstraint(constraint, uf, states)) {
          const adj = neighbors.get(variable) ?? new Set();
          for (const next of adj) {
            worklist.push(next);
          }
        }
      }
    }

    for (const [id, state] of states.entries()) {
      const rep = uf.find(id);
      const repState = states.get(rep) || state;
      const resolved = this.resolveVariable(rep, repState);
      if (resolved) {
        environment = environment.bind(id, resolved);
      }
    }

    return environment;
  }

  private join(types: Set<SemanticType>): SemanticType | undefined {
    if (types.size === 0) return undefined;
    if (types.size === 1) return Array.from(types.values())[0];
    return new UnionType(new ImmutableSet(types));
  }

  private resolveVariable(id: number, state: VariableState): SemanticType | undefined {
    const lower = this.join(state.lowerBounds);
    if (lower) return lower;
    return this.join(state.upperBounds);
  }

  private collectVariables(constraints: readonly Constraint[]): readonly number[] {
    const result = new Set<number>();
    for (const c of constraints) {
      switch (c.kind) {
        case 'Subtype':
          result.add(c.source.id);
          result.add(c.target.id);
          break;
        case 'PropertyExists':
          result.add(c.source.id);
          result.add(c.expected.id);
          break;
        case 'ReturnType':
          result.add(c.source.id);
          result.add(c.expected.id);
          break;
        case 'HasType':
          result.add(c.source.id);
          break;
      }
    }
    return Array.from(result.values());
  }

  private getAffectedConstraints(variable: number, index: Map<number, Constraint[]>): readonly Constraint[] {
    return index.get(variable) ?? [];
  }

  private solveConstraint(constraint: Constraint, uf: UnionFind, states: Map<number, VariableState>): boolean {
    switch (constraint.kind) {
      case 'PropertyExists':
        const srcState = states.get(constraint.source.id);
        if (srcState) {
          for (const type of srcState.lowerBounds) {
            if (type.kind === 'object') {
              const propType = type.properties.get(constraint.property);
              if (propType) {
                const expState = states.get(constraint.expected.id) || { lowerBounds: new Set(), upperBounds: new Set() };
                expState.lowerBounds.add(propType);
                states.set(constraint.expected.id, expState);
                return true;
              }
            }
          }
        }
        return false;
      case 'Equality':
        const rootA = uf.find(constraint.source.id);
        const rootB = uf.find(constraint.target.id);
        uf.union(constraint.source.id, constraint.target.id);
        const newRoot = uf.find(constraint.source.id);
        
        const stateA = states.get(rootA);
        const stateB = states.get(rootB);
        if (stateA || stateB) {
          const merged: VariableState = {
            lowerBounds: new Set([...(stateA?.lowerBounds || []), ...(stateB?.lowerBounds || [])]),
            upperBounds: new Set([...(stateA?.upperBounds || []), ...(stateB?.upperBounds || [])])
          };
          states.set(newRoot, merged);
        }
        return true;
      case 'Subtype':
        const sourceState = states.get(constraint.source.id) || { lowerBounds: new Set(), upperBounds: new Set() };
        const destState = states.get(constraint.target.id) || { lowerBounds: new Set(), upperBounds: new Set() };
        
        let changed = false;
        for (const lower of sourceState.lowerBounds) {
          if (!destState.lowerBounds.has(lower)) {
            destState.lowerBounds.add(lower);
            changed = true;

            for (const upper of destState.upperBounds) {
              if (!this.checkAssignability(lower, upper)) {
                this.diagnostics.push({
                  code: 'RS1023',
                  message: `Type conflict: Lower bound type '${this.typeName(lower)}' is incompatible with upper bound type '${this.typeName(upper)}'.`,
                  location: constraint.span
                });
              }
            }
          }
        }
        for (const upper of destState.upperBounds) {
          if (!sourceState.upperBounds.has(upper)) {
            sourceState.upperBounds.add(upper);
            changed = true;

            for (const lower of sourceState.lowerBounds) {
              if (!this.checkAssignability(lower, upper)) {
                this.diagnostics.push({
                  code: 'RS1023',
                  message: `Type conflict: Lower bound type '${this.typeName(lower)}' is incompatible with upper bound type '${this.typeName(upper)}'.`,
                  location: constraint.span
                });
              }
            }
          }
        }
        if (changed) {
          states.set(constraint.source.id, sourceState);
          states.set(constraint.target.id, destState);
        }
        return changed;
      case 'HasType':
        const hState = states.get(constraint.source.id) || { lowerBounds: new Set(), upperBounds: new Set() };
        let hChanged = false;
        if (!hState.lowerBounds.has(constraint.type)) {
          hState.lowerBounds.add(constraint.type);
          hChanged = true;
        }
        if (!hState.upperBounds.has(constraint.type)) {
          hState.upperBounds.add(constraint.type);
          hChanged = true;
        }
        if (hChanged) {
          states.set(constraint.source.id, hState);
        }
        return hChanged;
      default:
        return false;
    }
  }
}

export interface SymbolReference {
  readonly symbolId: number;
}

export class ArrayConstant {
  readonly kind = 'ArrayConstant';
  constructor(readonly elements: readonly ConstantValue[]) {}
}

export class ClassConstant {
  readonly kind = 'ClassConstant';
  constructor(readonly namespace: string, readonly className: string) {}
}

export class EnumCase {
  readonly kind = 'EnumCase';
  constructor(readonly enumName: string, readonly caseName: string) {}
}

export type ConstantValue =
  | string
  | number
  | boolean
  | null
  | ArrayConstant
  | ClassConstant
  | EnumCase
  | SymbolReference;

export type Expression =
  | { kind: 'Literal'; value: ConstantValue }
  | { kind: 'Call'; callee: string; readonly arguments: readonly Expression[] }
  | { kind: 'PropertyAccess'; target: Expression; property: string }
  | { kind: 'MethodCall'; target: Expression; method: string; readonly arguments: readonly Expression[] };

export interface SemanticValue {
  readonly type: SemanticType;
  readonly constantValue?: ConstantValue;
}

export interface CompilerFingerprint {
  readonly compilerVersion: string;
  readonly parserVersion: string;
  readonly phpVersion: string;
  readonly frameworkVersion: string;
  readonly targetBackend: string;
  readonly strictMode: boolean;
  readonly featureFlags: ReadonlyMap<string, boolean>;
}

export function computeFingerprintHash(fingerprint: CompilerFingerprint): string {
  const sortedFlags = Array.from(fingerprint.featureFlags.entries())
    .sort(([k1], [k2]) => k1.localeCompare(k2))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  const canonical = JSON.stringify({
    compilerVersion: fingerprint.compilerVersion,
    parserVersion: fingerprint.parserVersion,
    phpVersion: fingerprint.phpVersion,
    frameworkVersion: fingerprint.frameworkVersion,
    targetBackend: fingerprint.targetBackend,
    strictMode: fingerprint.strictMode,
    featureFlags: sortedFlags
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export interface CompilerOptions {
  readonly watch: boolean;
  readonly strict: boolean;
  readonly compilerVersion?: string;
  readonly parserVersion?: string;
  readonly phpVersion?: string;
  readonly frameworkVersion?: string;
  readonly targetBackend?: string;
  readonly featureFlags?: ReadonlyMap<string, boolean>;
}

export interface FileSnapshot {
  readonly filePath: string;
  readonly content: string;
  readonly hash: string;
}

export interface VirtualFileSystem {
  readFile(path: string): string;
  writeFile(path: string, content: string): void;
  snapshot(): readonly FileSnapshot[];
}

export class CompilationContext {
  constructor(
    public readonly diagnostics: DiagnosticBag,
    public readonly fileSystem: VirtualFileSystem,
    public readonly options: CompilerOptions
  ) {}

  public getFingerprint(): CompilerFingerprint {
    return {
      compilerVersion: this.options.compilerVersion || '6.1.0',
      parserVersion: this.options.parserVersion || '1.0.0',
      phpVersion: this.options.phpVersion || '8.2.0',
      frameworkVersion: this.options.frameworkVersion || '10.0.0',
      targetBackend: this.options.targetBackend || 'typescript',
      strictMode: this.options.strict,
      featureFlags: this.options.featureFlags || new Map()
    };
  }

  public static default(): CompilationContext {
    return new CompilationContext(
      DiagnosticBag.createEmpty(),
      {
        readFile: () => '',
        writeFile: () => {},
        snapshot: () => []
      },
      { watch: false, strict: true }
    );
  }
}

export type SemanticIRNodeKind =
  | 'EntityDeclaration'
  | 'EndpointDeclaration'
  | 'PropertyDeclaration'
  | 'RelationDeclaration';

export type IRNodeId = number;

export interface SemanticIRNode {
  readonly id: IRNodeId;
  readonly kind: SemanticIRNodeKind;
  readonly type: SemanticType;
  readonly inputs: readonly IRNodeId[];
  readonly origin?: SemanticOrigin;
  readonly ownerModule: string;
  readonly symbolId: number;
  readonly dependencyEdges: readonly IRNodeId[];
}

export class SemanticIRArena {
  private nodes: SemanticIRNode[] = [];

  public allocate(
    kind: SemanticIRNodeKind,
    type: SemanticType,
    inputs: readonly IRNodeId[],
    origin: SemanticOrigin | undefined,
    ownerModule: string,
    symbolId: number,
    dependencyEdges: readonly IRNodeId[]
  ): IRNodeId {
    const id = this.nodes.length;
    this.nodes.push({ id, kind, type, inputs, origin, ownerModule, symbolId, dependencyEdges });
    return id;
  }

  public get(id: IRNodeId): SemanticIRNode {
    const node = this.nodes[id];
    if (!node) throw new Error(`Invalid IRNodeId: ${id}`);
    return node;
  }
}

export interface SemanticOrigin {
  readonly span: FileSpan;
  readonly symbolId?: number;
}

export interface NodeId {
  readonly layer: 'entity' | 'schema' | 'endpoint' | 'relation';
  readonly name: string;
}

export interface ContractBaseNode {
  readonly id: NodeId;
  readonly name: string;
  readonly versionHash: string;
  readonly origin?: SemanticOrigin;
  accept<T>(visitor: ContractVisitor<T>): T;
}

export class EntityNode implements ContractBaseNode {
  readonly kind = 'entity';
  constructor(
    readonly id: NodeId,
    readonly name: string,
    readonly versionHash: string,
    readonly properties: ImmutableMap<string, SemanticType>,
    readonly origin?: SemanticOrigin
  ) {}
  public accept<T>(visitor: ContractVisitor<T>): T {
    return visitor.visitEntity(this);
  }
}

export class SchemaNode implements ContractBaseNode {
  readonly kind = 'schema';
  constructor(
    readonly id: NodeId,
    readonly name: string,
    readonly versionHash: string,
    readonly schema: SemanticType,
    readonly origin?: SemanticOrigin
  ) {}
  public accept<T>(visitor: ContractVisitor<T>): T {
    return visitor.visitSchema(this);
  }
}

export class RelationNode implements ContractBaseNode {
  readonly kind = 'relation';
  constructor(
    readonly id: NodeId,
    readonly name: string,
    readonly versionHash: string,
    readonly source: NodeId,
    readonly target: NodeId,
    readonly origin?: SemanticOrigin
  ) {}
  public accept<T>(visitor: ContractVisitor<T>): T {
    return visitor.visitRelation(this);
  }
}

export type ContractNode =
  | EntityNode
  | SchemaNode
  | RelationNode;

export class ContractGraph {
  constructor(public readonly nodes: ImmutableMap<string, ContractNode>) {
    Object.freeze(this);
  }

  public node(id: NodeId): ContractNode | undefined {
    return this.nodes.get(`${id.layer}:${id.name}`);
  }
}

export class ContractGraphBuilder {
  private nodes = new Map<string, ContractNode>();

  public addNode(node: ContractNode): this {
    this.nodes.set(`${node.id.layer}:${node.id.name}`, node);
    return this;
  }

  public build(): ContractGraph {
    return new ContractGraph(new ImmutableMap(this.nodes));
  }
}

export interface CompilationStatistics {
  readonly durationMs: number;
  readonly files: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly invalidatedNodes: number;
}

export class CompilationResult {
  constructor(
    public readonly astSnapshot: ASTArtifact,
    public readonly symbolGraph: SymbolGraphArtifact,
    public readonly constraintGraph: ConstraintGraphArtifact,
    public readonly typeEnvironment: TypeEnvironmentArtifact,
    public readonly semanticIR: SemanticIRArtifact,
    public readonly graph: ContractGraph,
    public readonly dependencyGraph: DependencyGraph,
    public readonly diagnostics: DiagnosticBag,
    public readonly symbolTable: SymbolTable,
    public readonly statistics: CompilationStatistics
  ) {
    Object.freeze(this);
  }
}

export interface GeneratedArtifact {
  readonly filePath: string;
  readonly content: string;
}

export interface ContractVisitor<T> {
  visitEntity(node: EntityNode): T;
  visitSchema(node: SchemaNode): T;
  visitRelation(node: RelationNode): T;
}

export interface BackendCapability {
  readonly supportsGenerics: boolean;
  readonly supportsNullable: boolean;
  readonly supportsReadonly: boolean;
}

export interface ContractEmitter {
  readonly capability: BackendCapability;
  emit(graph: ContractGraph): readonly GeneratedArtifact[];
}

export class TypeScriptEmitter implements ContractEmitter, ContractVisitor<GeneratedArtifact[]> {
  public readonly capability: BackendCapability = {
    supportsGenerics: true,
    supportsNullable: true,
    supportsReadonly: true
  };

  public emit(graph: ContractGraph): readonly GeneratedArtifact[] {
    const artifacts: GeneratedArtifact[] = [];
    for (const [_, node] of graph.nodes.entries()) {
      artifacts.push(...node.accept(this));
    }
    return artifacts;
  }

  public visitEntity(node: EntityNode): GeneratedArtifact[] {
    return [];
  }

  public visitSchema(node: SchemaNode): GeneratedArtifact[] {
    return [];
  }

  public visitRelation(node: RelationNode): GeneratedArtifact[] {
    return [];
  }
}

export interface CacheInputDescriptor {
  readonly artifactKey: ArtifactKey;
  readonly inputHash: string;
}

export interface CacheDescriptor {
  readonly passName: string;
  readonly inputs: readonly CacheInputDescriptor[];
  readonly compilerVersion: string;
  readonly optionsHash: string;
}

export interface ArtifactCache {
  get<K extends ArtifactKey>(descriptor: CacheDescriptor): ArtifactRegistry[K] | undefined;
  set<K extends ArtifactKey>(descriptor: CacheDescriptor, artifact: ArtifactRegistry[K]): void;
}



export class Arena<T> {
  private items: T[] = [];
  public allocate(item: T): number {
    const id = this.items.length;
    this.items.push(item);
    return id;
  }
  public get(id: number): T {
    const item = this.items[id];
    if (item === undefined) throw new Error(`Invalid Arena ID: ${id}`);
    return item;
  }
}

export type ASTNodeId = number;

export interface ASTNodeData {
  readonly kind: string;
  readonly span: FileSpan;
  readonly children: readonly ASTNodeId[];
}

export class ASTArena {
  private nodes: ASTNodeData[] = [];

  public allocateNode(kind: string, span: FileSpan, children: readonly ASTNodeId[]): ASTNodeId {
    const id = this.nodes.length;
    this.nodes.push({ kind, span, children });
    return id;
  }

  public getNode(id: ASTNodeId): ASTNodeData {
    const node = this.nodes[id];
    if (!node) throw new Error(`Invalid ASTNodeId: ${id}`);
    return node;
  }
}

export type QueryCell<V> =
  | { readonly kind: 'Pending'; readonly dependencies: readonly string[]; readonly verifiedAtRevision: string }
  | { readonly kind: 'Ready'; readonly value: V; readonly dependencies: readonly string[]; readonly verifiedAtRevision: string };

const memoizedQueryBrand = Symbol("memoizedQueryBrand");

export interface MemoizedQueryKey<O> {
  readonly id: string;
  readonly [memoizedQueryBrand]: (value: O) => O;
}

export function createMemoizedQueryKey<O>(id: string): MemoizedQueryKey<O> {
  return {
    id,
    [memoizedQueryBrand]: (value: O) => value,
  };
}

export class TypedCache {
  private store = new Map<symbol, unknown>();
  private keyRegistry = new Map<string, symbol>();

  private getOrCreateRuntimeSymbol(id: string): symbol {
    let sym = this.keyRegistry.get(id);
    if (!sym) {
      sym = Symbol(id);
      this.keyRegistry.set(id, sym);
    }
    return sym;
  }

  public get<T>(key: MemoizedQueryKey<T>): T | undefined {
    const sym = this.getOrCreateRuntimeSymbol(key.id);
    return this.store.get(sym) as T | undefined;
  }

  public set<T>(key: MemoizedQueryKey<T>, value: T): void {
    const sym = this.getOrCreateRuntimeSymbol(key.id);
    this.store.set(sym, value);
  }

  public has<T>(key: MemoizedQueryKey<T>): boolean {
    const sym = this.getOrCreateRuntimeSymbol(key.id);
    return this.store.has(sym);
  }
}

export interface QueryDescriptor<I, O> {
  readonly key: MemoizedQueryKey<O>;
  readonly inputHash: string;
  compute(input: I): O;
}

export class QueryDatabase {
  private cache = new TypedCache();

  public executeQuery<I, O>(
    query: QueryDescriptor<I, O>,
    input: I,
    dependencyFingerprint: string
  ): O {
    const keyId = `${query.key.id}:${query.inputHash}:${dependencyFingerprint}`;
    const cacheKey = createMemoizedQueryKey<O>(keyId);

    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const value = query.compute(input);
    this.cache.set(cacheKey, value);

    return value;
  }
}

export class MemoizedQueryDatabase {
  private cells = new TypedCache();
  private activeStack: string[] = [];

  public runQuery<I, O>(
    key: MemoizedQueryKey<O>,
    compute: (input: I) => O,
    input: I,
    revision: string
  ): O {
    const queryId = key.id;
    if (this.activeStack.length > 0) {
      const parent = this.activeStack[this.activeStack.length - 1];
      const parentCellKey = createMemoizedQueryKey<QueryCell<unknown>>(parent);
      const parentCell = this.cells.get(parentCellKey);
      if (parentCell) {
        const newDeps = [...parentCell.dependencies, queryId];
        if (parentCell.kind === 'Ready') {
          this.cells.set(parentCellKey, {
            kind: 'Ready',
            value: parentCell.value,
            dependencies: newDeps,
            verifiedAtRevision: parentCell.verifiedAtRevision
          });
        } else {
          this.cells.set(parentCellKey, {
            kind: 'Pending',
            dependencies: newDeps,
            verifiedAtRevision: parentCell.verifiedAtRevision
          });
        }
      }
    }

    const cellKey = createMemoizedQueryKey<QueryCell<O>>(queryId);
    const cached = this.cells.get(cellKey);
    if (cached && cached.kind === 'Ready' && cached.verifiedAtRevision === revision) {
      return cached.value;
    }

    this.activeStack.push(queryId);
    this.cells.set(cellKey, {
      kind: 'Pending',
      dependencies: [],
      verifiedAtRevision: revision
    });

    try {
      const value = compute(input);
      const cell = this.cells.get(cellKey);
      if (cell) {
        this.cells.set(cellKey, {
          kind: 'Ready',
          value,
          dependencies: cell.dependencies,
          verifiedAtRevision: revision
        });
      }
      return value;
    } finally {
      this.activeStack.pop();
    }
  }
}

export function computeStableSymbolId(namespace: string, qualifiedName: string, span: FileSpan): string {
  const data = `${namespace}\\${qualifiedName}:${span.filePath}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

export interface BasicBlock {
  readonly id: number;
  readonly instructions: readonly (Expression | Instruction)[];
  readonly successors: readonly number[];
  readonly predecessors: readonly number[];
}

export class ControlFlowGraph {
  constructor(
    public readonly entryBlock: number,
    public readonly exitBlock: number,
    public readonly blocks: ReadonlyMap<number, BasicBlock>
  ) {}
}

export interface FlowState<T> {
  readonly inState: T;
  readonly outState: T;
}

export class DataFlowAnalysis<T> {
  public analyze(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): ReadonlyMap<number, FlowState<T>> {
    const states = new Map<number, FlowState<T>>();
    for (const [id] of cfg.blocks) {
      states.set(id, { inState: initialState, outState: initialState });
    }
    const worklist = Array.from(cfg.blocks.keys());

    while (worklist.length > 0) {
      const blockId = worklist.shift()!;
      const block = cfg.blocks.get(blockId)!;
      const current = states.get(blockId)!;

      const predStates = block.predecessors
        .map(pid => states.get(pid)?.outState)
        .filter((s): s is T => s !== undefined);

      const newInState = predStates.length > 0 ? merge(predStates) : current.inState;
      const newOutState = transfer(block, newInState);

      if (JSON.stringify(current.outState) !== JSON.stringify(newOutState) || JSON.stringify(current.inState) !== JSON.stringify(newInState)) {
        states.set(blockId, { inState: newInState, outState: newOutState });
        for (const succ of block.successors) {
          if (!worklist.includes(succ)) {
            worklist.push(succ);
          }
        }
      }
    }
    return states;
  }
}

export interface SymbolNode {
  readonly id: string;
  readonly kind: 'class' | 'method' | 'property';
  readonly name: string;
  readonly namespace: string;
  readonly parentId?: string;
  readonly extendsId?: string;
  readonly implementsIds: readonly string[];
}

export class SymbolDatabase {
  private symbols = new Map<string, SymbolNode>();
  private referenceGraph = new Map<string, Set<string>>();

  public registerSymbol(node: SymbolNode): void {
    this.symbols.set(node.id, node);
  }

  public addReference(fromId: string, toId: string): void {
    const refs = this.referenceGraph.get(fromId) ?? new Set();
    refs.add(toId);
    this.referenceGraph.set(fromId, refs);
  }

  public getSymbol(id: string): SymbolNode | undefined {
    return this.symbols.get(id);
  }

  public getReferences(fromId: string): ReadonlySet<string> {
    return this.referenceGraph.get(fromId) ?? new Set();
  }
}

export class TarjanSCC {
  public static decompose(
    graph: DependencyGraph
  ): readonly (readonly string[])[] {
    const sccs: string[][] = [];
    const index = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    let nextIndex = 0;

    function strongConnect(node: string) {
      index.set(node, nextIndex);
      lowlink.set(node, nextIndex);
      nextIndex++;
      stack.push(node);
      onStack.add(node);

      const neighbors = graph.forward.get(node)?.values() || [];
      for (const neighbor of neighbors) {
        if (!index.has(neighbor)) {
          strongConnect(neighbor);
          lowlink.set(node, Math.min(lowlink.get(node)!, lowlink.get(neighbor)!));
        } else if (onStack.has(neighbor)) {
          lowlink.set(node, Math.min(lowlink.get(node)!, index.get(neighbor)!));
        }
      }

      if (lowlink.get(node) === index.get(node)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== node);
        sccs.push(scc);
      }
    }

    for (const node of graph.forward.keys()) {
      if (!index.has(node)) {
        strongConnect(node);
      }
    }
    return sccs;
  }
}

export type Operand =
  | { kind: 'Constant'; value: unknown }
  | { kind: 'Variable'; id: number }
  | { kind: 'SSAValue'; id: number };

export type Instruction =
  | { kind: 'Assign'; target: number; value: Operand }
  | { kind: 'Jump'; targetBlockId: number }
  | { kind: 'Branch'; condition: Operand; trueBlockId: number; falseBlockId: number }
  | { kind: 'Call'; target: string; args: readonly Operand[] }
  | { kind: 'Return'; value?: Operand }
  | { kind: 'Phi'; target: number; incoming: ReadonlyMap<number, Operand> }
  | { kind: 'LoadProperty'; target: number; obj: Operand; property: string }
  | { kind: 'StoreProperty'; obj: Operand; property: string; value: Operand };

export interface SSABasicBlock {
  readonly id: number;
  readonly instructions: readonly Instruction[];
  readonly successors: readonly number[];
  readonly predecessors: readonly number[];
}

export class SSARepresentation {
  constructor(
    public readonly entryBlock: number,
    public readonly blocks: ReadonlyMap<number, SSABasicBlock>
  ) {}
}

export class DominatorTree {
  private idoms = new Map<number, number>();
  private domTree = new Map<number, Set<number>>();

  public compute(cfg: ControlFlowGraph): void {
    const blocks = Array.from(cfg.blocks.values());
    if (blocks.length === 0) return;

    const startNode = cfg.entryBlock;
    this.idoms.set(startNode, startNode);

    const rpo = this.computeRPO(cfg);

    let changed = true;
    while (changed) {
      changed = false;
      for (const blockId of rpo) {
        if (blockId === startNode) continue;

        const block = cfg.blocks.get(blockId)!;
        const processedPreds = block.predecessors.filter(p => this.idoms.has(p));
        if (processedPreds.length === 0) continue;

        let newIdom = processedPreds[0]!;
        for (let i = 1; i < processedPreds.length; i++) {
          const pred = processedPreds[i]!;
          newIdom = this.intersect(pred, newIdom, rpo);
        }

        if (this.idoms.get(blockId) !== newIdom) {
          this.idoms.set(blockId, newIdom);
          changed = true;
        }
      }
    }

    for (const [node, idom] of this.idoms) {
      if (node === startNode) continue;
      const children = this.domTree.get(idom) ?? new Set();
      children.add(node);
      this.domTree.set(idom, children);
    }
  }

  private intersect(b1: number, b2: number, rpo: readonly number[]): number {
    let finger1 = b1;
    let finger2 = b2;
    const rpoIndex = new Map<number, number>(rpo.map((id, idx) => [id, idx]));

    while (finger1 !== finger2) {
      const idx1 = rpoIndex.get(finger1) ?? -1;
      const idx2 = rpoIndex.get(finger2) ?? -1;
      if (idx1 > idx2) {
        finger1 = this.idoms.get(finger1)!;
      } else {
        finger2 = this.idoms.get(finger2)!;
      }
    }
    return finger1;
  }

  private computeRPO(cfg: ControlFlowGraph): readonly number[] {
    const visited = new Set<number>();
    const order: number[] = [];

    const self = this;
    function dfs(nodeId: number) {
      visited.add(nodeId);
      const block = cfg.blocks.get(nodeId);
      if (block) {
        for (const succ of block.successors) {
          if (!visited.has(succ)) {
            dfs(succ);
          }
        }
      }
      order.push(nodeId);
    }

    dfs(cfg.entryBlock);
    return order.reverse();
  }

  public getImmediateDominator(blockId: number): number | undefined {
    return this.idoms.get(blockId);
  }

  public getChildren(blockId: number): ReadonlySet<number> {
    return this.domTree.get(blockId) ?? new Set();
  }

  public dominates(ancestor: number, descendant: number): boolean {
    let current: number | undefined = descendant;
    while (current !== undefined) {
      if (current === ancestor) return true;
      const next: number | undefined = this.getImmediateDominator(current);
      if (next === current) break;
      current = next;
    }
    return false;
  }
}

export interface LoopInfo {
  readonly header: number;
  readonly backEdges: readonly number[];
  readonly loopBlocks: ReadonlySet<number>;
}

export class LoopAnalysis {
  public static analyze(
    cfg: ControlFlowGraph,
    dom: DominatorTree
  ): readonly LoopInfo[] {
    const loopsMap = new Map<number, Set<number>>();

    for (const [nodeId, block] of cfg.blocks) {
      for (const succ of block.successors) {
        if (dom.dominates(succ, nodeId)) {
          const backEdges = loopsMap.get(succ) ?? new Set();
          backEdges.add(nodeId);
          loopsMap.set(succ, backEdges);
        }
      }
    }

    const loopInfos: LoopInfo[] = [];
    for (const [header, backEdgesSet] of loopsMap) {
      const backEdges = Array.from(backEdgesSet);
      const loopBlocks = this.getNaturalLoop(header, backEdges, cfg);
      loopInfos.push({
        header,
        backEdges,
        loopBlocks
      });
    }

    return loopInfos;
  }

  private static getNaturalLoop(
    header: number,
    backEdges: readonly number[],
    cfg: ControlFlowGraph
  ): ReadonlySet<number> {
    const loopBlocks = new Set<number>([header]);
    const queue: number[] = [];

    for (const edge of backEdges) {
      if (!loopBlocks.has(edge)) {
        loopBlocks.add(edge);
        queue.push(edge);
      }
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      const block = cfg.blocks.get(node);
      if (block) {
        for (const pred of block.predecessors) {
          if (!loopBlocks.has(pred)) {
            loopBlocks.add(pred);
            queue.push(pred);
          }
        }
      }
    }

    return loopBlocks;
  }
}

export class DominanceFrontier {
  private frontiers = new Map<number, Set<number>>();

  public compute(cfg: ControlFlowGraph, dom: DominatorTree): void {
    for (const [blockId] of cfg.blocks) {
      this.frontiers.set(blockId, new Set());
    }

    for (const [blockId, block] of cfg.blocks) {
      if (block.predecessors.length >= 2) {
        for (const predId of block.predecessors) {
          let runner = predId;
          const idom = dom.getImmediateDominator(blockId);
          while (runner !== idom && runner !== undefined) {
            this.frontiers.get(runner)?.add(blockId);
            const next = dom.getImmediateDominator(runner);
            if (next === runner) break;
            runner = next!;
          }
        }
      }
    }
  }

  public getFrontier(blockId: number): ReadonlySet<number> {
    return this.frontiers.get(blockId) ?? new Set();
  }
}

export class UseDefGraph {
  private defs = new Map<number, number>();
  private uses = new Map<number, Set<number>>();

  public recordDef(valueId: number, instructionId: number): void {
    this.defs.set(valueId, instructionId);
  }

  public recordUse(valueId: number, instructionId: number): void {
    const set = this.uses.get(valueId) ?? new Set();
    set.add(instructionId);
    this.uses.set(valueId, set);
  }

  public getDefinition(valueId: number): number | undefined {
    return this.defs.get(valueId);
  }

  public getUses(valueId: number): ReadonlySet<number> {
    return this.uses.get(valueId) ?? new Set();
  }
}

export interface QueryKey {
  readonly queryName: string;
  readonly targetId: string;
  readonly optionsHash: string;
}

export interface QueryNode {
  readonly key: QueryKey;
  readonly value: unknown;
  readonly dependencies: ReadonlySet<string>;
  readonly dependents: ReadonlySet<string>;
  readonly lastChangedRevision: number;
  readonly lastVerifiedRevision: number;
}

export interface FileSpan {
  readonly file: string;
  readonly startLine: number;
  readonly startChar: number;
  readonly endLine: number;
  readonly endChar: number;
}

export interface QueryContext {
  readonly packageId?: string;
  readonly moduleId?: string;
  readonly symbolId?: string;
}

export interface QueryFrame {
  readonly key: QueryKey;
  readonly queryKind: string;
  readonly context?: QueryContext;
  readonly span?: FileSpan;
}

export class QueryCycleError extends Error {
  constructor(
    message: string,
    public readonly queryStack: readonly QueryFrame[]
  ) {
    super(message);
    this.name = 'QueryCycleError';
  }
}

export class SalsaCompiler {
  private queryGraph = new Map<string, QueryNode>();
  private activeQueries = new Set<string>();
  private activeQueryStack: string[] = [];
  private queryKeys = new Map<string, QueryKey>();

  constructor(
    private readonly symbolDb: SymbolDatabase
  ) {}

  public executeQuery<I, O>(
    key: QueryKey,
    compute: (input: I) => O,
    input: I,
    currentRevision: number
  ): O {
    const keyStr = `${key.queryName}:${key.targetId}:${key.optionsHash}`;

    if (this.activeQueries.has(keyStr)) {
      const cycleFrames = this.activeQueryStack.map(k => {
        const queryKey = this.queryKeys.get(k)!;
        return {
          key: queryKey,
          queryKind: queryKey.queryName,
          context: {
            symbolId: queryKey.targetId
          }
        };
      });
      cycleFrames.push({
        key,
        queryKind: key.queryName,
        context: {
          symbolId: key.targetId
        }
      });
      const cyclePath = [...this.activeQueryStack, keyStr].join(' -> ');
      throw new QueryCycleError(`Query cycle detected: ${cyclePath}`, cycleFrames);
    }

    if (this.activeQueryStack.length > 0) {
      const parentKey = this.activeQueryStack[this.activeQueryStack.length - 1];
      const parentNode = this.queryGraph.get(parentKey);
      if (parentNode) {
        const nextDeps = new Set([...parentNode.dependencies, keyStr]);
        this.queryGraph.set(parentKey, { ...parentNode, dependencies: nextDeps });
      }

      const childNode = this.queryGraph.get(keyStr);
      if (childNode) {
        const nextDepsOfChild = new Set([...childNode.dependents, parentKey]);
        this.queryGraph.set(keyStr, { ...childNode, dependents: nextDepsOfChild });
      }
    }

    const cached = this.queryGraph.get(keyStr);
    if (cached) {
      let dependenciesValid = true;
      for (const depKey of cached.dependencies) {
        const depNode = this.queryGraph.get(depKey);
        if (!depNode || depNode.lastChangedRevision > cached.lastVerifiedRevision) {
          dependenciesValid = false;
          break;
        }
      }

      if (dependenciesValid && cached.lastVerifiedRevision === currentRevision) {
        return cached.value as O;
      }
    }

    this.activeQueries.add(keyStr);
    this.queryKeys.set(keyStr, key);
    this.activeQueryStack.push(keyStr);
    const existingNode = this.queryGraph.get(keyStr);
    this.queryGraph.set(keyStr, {
      key,
      value: existingNode ? existingNode.value : undefined,
      dependencies: new Set(),
      dependents: existingNode ? existingNode.dependents : new Set(),
      lastChangedRevision: existingNode ? existingNode.lastChangedRevision : currentRevision,
      lastVerifiedRevision: currentRevision
    });

    try {
      const value = compute(input);
      const node = this.queryGraph.get(keyStr);
      if (node) {
        const valueChanged = JSON.stringify(node.value) !== JSON.stringify(value);
        this.queryGraph.set(keyStr, {
          ...node,
          value,
          lastChangedRevision: valueChanged ? currentRevision : node.lastChangedRevision,
          lastVerifiedRevision: currentRevision
        });

        if (valueChanged) {
          this.invalidateDependents(keyStr, currentRevision);
        }
      }
      return value;
    } finally {
      this.activeQueries.delete(keyStr);
      this.activeQueryStack.pop();
    }
  }

  private invalidateDependents(keyStr: string, revision: number): void {
    const queue = [keyStr];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      visited.add(current);

      const node = this.queryGraph.get(current);
      if (node) {
        for (const dep of node.dependents) {
          if (!visited.has(dep)) {
            const depNode = this.queryGraph.get(dep);
            if (depNode) {
              this.queryGraph.set(dep, {
                ...depNode,
                lastVerifiedRevision: revision - 1
              });
              queue.push(dep);
            }
          }
        }
      }
    }
  }

  public typecheck(symbolId: string, revision: number): SemanticType {
    const key: QueryKey = { queryName: 'typecheck', targetId: symbolId, optionsHash: 'default' };
    return this.executeQuery(
      key,
      () => {
        const sym = this.symbolDb.getSymbol(symbolId);
        if (!sym) throw new Error(`Symbol not found: ${symbolId}`);
        return new PrimitiveType(PrimitiveKind.STRING);
      },
      undefined,
      revision
    );
  }
}

export class SSABuilder {
  public static insertPhiNodes(
    cfg: ControlFlowGraph,
    df: DominanceFrontier,
    variables: readonly number[]
  ): ControlFlowGraph {
    const blocks = new Map<number, BasicBlock>(cfg.blocks);

    for (const varId of variables) {
      const defBlocks = new Set<number>();
      for (const [blockId, block] of cfg.blocks) {
        for (const inst of block.instructions) {
          if (inst.kind === 'Assign' && inst.target === varId) {
            defBlocks.add(blockId);
          }
        }
      }

      const worklist = Array.from(defBlocks);
      const addedPhis = new Set<number>();

      while (worklist.length > 0) {
        const x = worklist.shift()!;
        for (const y of df.getFrontier(x)) {
          if (!addedPhis.has(y)) {
            const block = blocks.get(y);
            if (block) {
              const incoming = new Map<number, Operand>();
              for (const pred of block.predecessors) {
                incoming.set(pred, { kind: 'Variable', id: varId });
              }
              const phiInst: Instruction = {
                kind: 'Phi',
                target: varId,
                incoming
              };

              blocks.set(y, {
                ...block,
                instructions: [phiInst, ...block.instructions]
              });
              addedPhis.add(y);

              if (!defBlocks.has(y)) {
                worklist.push(y);
              }
            }
          }
        }
      }
    }

    return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
  }
}

export class SSARenamer {
  private count = new Map<number, number>();
  private stack = new Map<number, number[]>();

  public rename(cfg: ControlFlowGraph, dom: DominatorTree): ControlFlowGraph {
    const blocks = new Map<number, BasicBlock>(cfg.blocks);

    for (const [_, block] of cfg.blocks) {
      for (const inst of block.instructions) {
        if (inst.kind === 'Assign') {
          this.count.set(inst.target, 0);
          this.stack.set(inst.target, [0]);
        }
      }
    }

    const self = this;
    function renameBlock(blockId: number) {
      const block = blocks.get(blockId);
      if (!block) return;

      const newInstructions: (Expression | Instruction)[] = [];

      for (const inst of block.instructions) {
        if (inst.kind === 'Phi') {
          const varId = inst.target;
          const currentCount = (self.count.get(varId) ?? 0) + 1;
          self.count.set(varId, currentCount);
          self.stack.get(varId)?.push(currentCount);

          newInstructions.push({
            kind: 'Phi',
            target: currentCount,
            incoming: inst.incoming
          });
        }
      }

      for (const inst of block.instructions) {
        if (inst.kind === 'Phi') continue;

        let renamedInst = inst;
        if (inst.kind === 'Assign') {
          const varId = inst.target;
          const currentCount = (self.count.get(varId) ?? 0) + 1;
          self.count.set(varId, currentCount);
          self.stack.get(varId)?.push(currentCount);

          renamedInst = {
            kind: 'Assign',
            target: currentCount,
            value: self.renameOperand(inst.value)
          };
        } else if (inst.kind === 'Call') {
          if ('target' in inst) {
            renamedInst = {
              kind: 'Call',
              target: inst.target,
              args: inst.args.map((arg: Operand) => self.renameOperand(arg))
            };
          }
        } else if (inst.kind === 'Return' && inst.value) {
          renamedInst = {
            kind: 'Return',
            value: self.renameOperand(inst.value)
          };
        }
        newInstructions.push(renamedInst);
      }

      blocks.set(blockId, {
        ...block,
        instructions: newInstructions
      });

      for (const succId of block.successors) {
        const succ = blocks.get(succId);
        if (succ) {
          const updatedInsts = succ.instructions.map(inst => {
            if (inst.kind === 'Phi') {
              const incoming = new Map<number, Operand>(inst.incoming);
              for (const [predId, op] of incoming) {
                if (predId === blockId && op.kind === 'Variable') {
                  const activeVersions = self.stack.get(op.id) ?? [];
                  const activeVersion = activeVersions[activeVersions.length - 1] ?? op.id;
                  incoming.set(predId, { kind: 'SSAValue', id: activeVersion });
                }
              }
              return { ...inst, incoming };
            }
            return inst;
          });
          blocks.set(succId, { ...succ, instructions: updatedInsts });
        }
      }

      const children = dom.getChildren(blockId);
      for (const childId of children) {
        renameBlock(childId);
      }

      for (const inst of block.instructions) {
        if (inst.kind === 'Assign' || inst.kind === 'Phi') {
          const varId = inst.target;
          self.stack.get(varId)?.pop();
        }
      }
    }

    renameBlock(cfg.entryBlock);
    return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
  }

  private renameOperand(op: Operand): Operand {
    if (op.kind === 'Variable') {
      const activeVersions = this.stack.get(op.id) ?? [];
      const activeVersion = activeVersions[activeVersions.length - 1];
      if (activeVersion !== undefined) {
        return { kind: 'SSAValue', id: activeVersion };
      }
    }
    return op;
  }
}

export type InstructionEffect =
  | 'Pure'
  | 'ReadMemory'
  | 'WriteMemory'
  | 'Allocate'
  | 'IO'
  | 'Throw'
  | 'CallUnknown';

export function getInstructionEffect(inst: Instruction): InstructionEffect {
  switch (inst.kind) {
    case 'Call':
      return 'CallUnknown';
    case 'StoreProperty':
      return 'WriteMemory';
    case 'LoadProperty':
      return 'ReadMemory';
    default:
      return 'Pure';
  }
}

export class SSAOptimizer {
  public static foldConstants(instructions: readonly Instruction[]): readonly Instruction[] {
    return instructions;
  }

  public static eliminateDeadCode(
    instructions: readonly Instruction[],
    useDef: UseDefGraph
  ): readonly Instruction[] {
    return instructions.filter(inst => {
      if (inst.kind === 'Assign') {
        const effect = getInstructionEffect(inst);
        if (effect !== 'Pure') return true;
        return useDef.getUses(inst.target).size > 0;
      }
      return true;
    });
  }
}

export function computeIRHash(instructions: readonly Instruction[]): string {
  return createHash('sha256').update(JSON.stringify(instructions)).digest('hex');
}

export class OptimizationPipeline {
  public static runFixpoint(
    instructions: readonly Instruction[],
    useDef: UseDefGraph
  ): readonly Instruction[] {
    let current = instructions;
    let changed = true;
    let lastHash = computeIRHash(current);

    while (changed) {
      changed = false;
      const folded = SSAOptimizer.foldConstants(current);
      const pruned = SSAOptimizer.eliminateDeadCode(folded, useDef);

      const newHash = computeIRHash(pruned);
      if (newHash !== lastHash) {
        current = pruned;
        lastHash = newHash;
        changed = true;
      }
    }
    return current;
  }
}

declare const analysisKeyBrand: unique symbol;

export interface AnalysisKey<T> {
  readonly [analysisKeyBrand]: T;
}

export class AnalysisKey<T> {
  constructor(readonly name: string) {}
}

export const CFGAnalysis = new AnalysisKey<ControlFlowGraph>('CFG');
export const DominatorsAnalysis = new AnalysisKey<DominatorTree>('Dominators');
export const LoopInfoAnalysis = new AnalysisKey<LoopAnalysis>('LoopInfo');
export const SSAAnalysis = new AnalysisKey<SSARepresentation>('SSA');
export const UseDefAnalysis = new AnalysisKey<UseDefGraph>('UseDef');

export interface OptimizationPass {
  readonly name: string;
  readonly requires: ReadonlySet<AnalysisKey<unknown>>;
  readonly preserves: ReadonlySet<AnalysisKey<unknown>>;
  readonly invalidates: ReadonlySet<AnalysisKey<unknown>>;
}

export class PhiEliminator {
  public static eliminate(cfg: ControlFlowGraph): ControlFlowGraph {
    const blocks = new Map<number, BasicBlock>(cfg.blocks);

    for (const [blockId, block] of cfg.blocks) {
      const phiNodes: Instruction[] = [];
      const nonPhiNodes: (Expression | Instruction)[] = [];

      for (const inst of block.instructions) {
        if (inst.kind === 'Phi') {
          phiNodes.push(inst);
        } else {
          nonPhiNodes.push(inst);
        }
      }

      if (phiNodes.length === 0) continue;

      for (const phi of phiNodes) {
        if (phi.kind !== 'Phi') continue;

        for (const [predId, operand] of phi.incoming) {
          const predBlock = blocks.get(predId);
          if (predBlock) {
            const copyInst: Instruction = {
              kind: 'Assign',
              target: phi.target,
              value: operand
            };

            const terminatorIndex = predBlock.instructions.findIndex(inst =>
              inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return'
            );

            const nextInstructions = [...predBlock.instructions];
            if (terminatorIndex === -1) {
              nextInstructions.push(copyInst);
            } else {
              nextInstructions.splice(terminatorIndex, 0, copyInst);
            }

            blocks.set(predId, {
              ...predBlock,
              instructions: nextInstructions
            });
          }
        }
      }

      blocks.set(blockId, {
        ...block,
        instructions: nonPhiNodes
      });
    }

    return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
  }
}

export class CopyCoalescer {
  public static coalesce(
    instructions: readonly Instruction[],
    useDef: UseDefGraph
  ): readonly Instruction[] {
    const coalesced: Instruction[] = [];
    const renamingMap = new Map<number, number>();

    for (const inst of instructions) {
      if (inst.kind === 'Assign' && inst.value.kind === 'SSAValue') {
        const sourceVal = inst.value.id;
        const targetVal = inst.target;
        renamingMap.set(targetVal, sourceVal);
      } else {
        coalesced.push(inst);
      }
    }

    return coalesced.map(inst => {
      if (inst.kind === 'Assign') {
        const mappedTarget = renamingMap.get(inst.target) ?? inst.target;
        return {
          ...inst,
          target: mappedTarget,
          value: inst.value.kind === 'SSAValue' && renamingMap.has(inst.value.id)
            ? { kind: 'SSAValue', id: renamingMap.get(inst.value.id)! }
            : inst.value
        };
      }
      return inst;
    });
  }
}

export function isSpeculatable(inst: Instruction): boolean {
  const effect = getInstructionEffect(inst);
  if (effect !== 'Pure') return false;
  return true;
}

export class LICMOptimizer {
  public static hoistInvariants(
    cfg: ControlFlowGraph,
    loopBlocks: ReadonlySet<number>,
    preHeaderId: number,
    useDef: UseDefGraph
  ): ControlFlowGraph {
    const blocks = new Map<number, BasicBlock>(cfg.blocks);
    const preHeader = blocks.get(preHeaderId);
    if (!preHeader) return cfg;

    const hoisted: Instruction[] = [];

    for (const blockId of loopBlocks) {
      const block = blocks.get(blockId);
      if (block) {
        const remaining: (Expression | Instruction)[] = [];
        for (const inst of block.instructions) {
          if (inst.kind === 'Assign' && isSpeculatable(inst)) {
            let isInvariant = true;
            if (inst.value.kind === 'SSAValue') {
              const defBlock = useDef.getDefinition(inst.value.id);
              if (defBlock !== undefined && loopBlocks.has(defBlock)) {
                isInvariant = false;
              }
            } else if (inst.value.kind === 'Variable') {
              const defBlock = useDef.getDefinition(inst.value.id);
              if (defBlock !== undefined && loopBlocks.has(defBlock)) {
                isInvariant = false;
              }
            }

            if (isInvariant) {
              hoisted.push(inst);
              continue;
            }
          }
          remaining.push(inst);
        }
        blocks.set(blockId, { ...block, instructions: remaining });
      }
    }

    if (hoisted.length > 0) {
      const terminatorIndex = preHeader.instructions.findIndex(inst =>
        inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return'
      );
      const nextInsts = [...preHeader.instructions];
      if (terminatorIndex === -1) {
        nextInsts.push(...hoisted);
      } else {
        nextInsts.splice(terminatorIndex, 0, ...hoisted);
      }
      blocks.set(preHeaderId, { ...preHeader, instructions: nextInsts });
    }

    return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
  }
}

export class LoopNormalizer {
  public static ensurePreHeader(
    cfg: ControlFlowGraph,
    loopBlocks: ReadonlySet<number>,
    headerId: number
  ): { cfg: ControlFlowGraph; preHeaderId: number } {
    const blocks = new Map<number, BasicBlock>(cfg.blocks);
    const header = blocks.get(headerId);
    if (!header) return { cfg, preHeaderId: cfg.entryBlock };

    const outerPreds = header.predecessors.filter(p => !loopBlocks.has(p));

    if (outerPreds.length === 1 && blocks.get(outerPreds[0])?.successors.length === 1) {
      return { cfg, preHeaderId: outerPreds[0] };
    }

    const preHeaderId = Math.max(...cfg.blocks.keys()) + 1;
    const jump: Instruction = { kind: 'Jump', targetBlockId: headerId };
    const preHeaderBlock: BasicBlock = {
      id: preHeaderId,
      instructions: [jump],
      successors: [headerId],
      predecessors: outerPreds
    };
    blocks.set(preHeaderId, preHeaderBlock);

    for (const predId of outerPreds) {
      const pred = blocks.get(predId);
      if (pred) {
        const nextSuccs = pred.successors.map(s => s === headerId ? preHeaderId : s);
        const nextInsts = pred.instructions.map(inst => {
          if (inst.kind === 'Jump' && inst.targetBlockId === headerId) {
            return { ...inst, targetBlockId: preHeaderId };
          }
          if (inst.kind === 'Branch') {
            return {
              ...inst,
              trueBlockId: inst.trueBlockId === headerId ? preHeaderId : inst.trueBlockId,
              falseBlockId: inst.falseBlockId === headerId ? preHeaderId : inst.falseBlockId
            };
          }
          return inst;
        });
        blocks.set(predId, { ...pred, successors: nextSuccs, instructions: nextInsts });
      }
    }

    const nextHeaderPreds = header.predecessors.filter(p => loopBlocks.has(p));
    nextHeaderPreds.push(preHeaderId);
    blocks.set(headerId, { ...header, predecessors: nextHeaderPreds });

    return {
      cfg: new ControlFlowGraph(cfg.entryBlock === headerId ? preHeaderId : cfg.entryBlock, cfg.exitBlock, blocks),
      preHeaderId
    };
  }
}

export class FIFOQueue<T> {
  private items: T[] = [];
  private head = 0;

  public enqueue(item: T): void {
    this.items.push(item);
  }

  public dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const item = this.items[this.head++];
    if (this.head > 1024 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  public get length(): number {
    return this.items.length - this.head;
  }

  public get isEmpty(): boolean {
    return this.length === 0;
  }
}

export class AnalysisDependencyGraph {
  private dependentsMap = new Map<AnalysisKey<unknown>, Set<AnalysisKey<unknown>>>();
  private dependenciesMap = new Map<AnalysisKey<unknown>, Set<AnalysisKey<unknown>>>();

  public addDependency(parent: AnalysisKey<unknown>, child: AnalysisKey<unknown>): void {
    const deps = this.dependentsMap.get(parent) ?? new Set();
    deps.add(child);
    this.dependentsMap.set(parent, deps);

    const revs = this.dependenciesMap.get(child) ?? new Set();
    revs.add(parent);
    this.dependenciesMap.set(child, revs);
  }

  public removeDependency(parent: AnalysisKey<unknown>, child: AnalysisKey<unknown>): void {
    const deps = this.dependentsMap.get(parent);
    if (deps) {
      deps.delete(child);
      if (deps.size === 0) this.dependentsMap.delete(parent);
    }

    const revs = this.dependenciesMap.get(child);
    if (revs) {
      revs.delete(parent);
      if (revs.size === 0) this.dependenciesMap.delete(child);
    }
  }

  public dependents(key: AnalysisKey<unknown>): ReadonlySet<AnalysisKey<unknown>> {
    return this.dependentsMap.get(key) ?? new Set();
  }

  public dependencies(key: AnalysisKey<unknown>): ReadonlySet<AnalysisKey<unknown>> {
    return this.dependenciesMap.get(key) ?? new Set();
  }

  public clear(): void {
    this.dependentsMap.clear();
    this.dependenciesMap.clear();
  }
}

export class AnalysisManager {
  private cache = new Map<AnalysisKey<unknown>, unknown>();
  private graph = new AnalysisDependencyGraph();

  public get<T>(key: AnalysisKey<T>): T | undefined {
    return this.cache.get(key as unknown as AnalysisKey<unknown>) as T | undefined;
  }

  public set<T>(key: AnalysisKey<T>, value: T): void {
    this.cache.set(key as unknown as AnalysisKey<unknown>, value);
  }

  public registerDependency(parent: AnalysisKey<unknown>, child: AnalysisKey<unknown>): void {
    this.graph.addDependency(parent, child);
  }

  public collectDependents(key: AnalysisKey<unknown>): ReadonlySet<AnalysisKey<unknown>> {
    const visited = new Set<AnalysisKey<unknown>>();
    const queue = new FIFOQueue<AnalysisKey<unknown>>();
    queue.enqueue(key);

    while (!queue.isEmpty) {
      const current = queue.dequeue()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = this.graph.dependents(current);
      for (const dep of deps) {
        queue.enqueue(dep);
      }
    }
    return visited;
  }

  public invalidate(key: AnalysisKey<unknown>): void {
    const dependents = this.collectDependents(key);
    for (const dep of dependents) {
      this.cache.delete(dep);
    }
  }

  public clear(): void {
    this.cache.clear();
    this.graph.clear();
  }
}

export interface PassResult {
  readonly changed: boolean;
  readonly preservedAnalyses: ReadonlySet<AnalysisKey<unknown>>;
  readonly diagnostics?: DiagnosticBag;
}

export enum VerifierPhase {
  PreOptimization = 'PreOptimization',
  PostOptimization = 'PostOptimization',
  Final = 'Final'
}

export interface VerificationContext {
  readonly cfg: ControlFlowGraph;
  readonly dom?: DominatorTree;
  readonly ssa?: SSARepresentation;
  readonly manager?: AnalysisManager;
}

export abstract class Verifier {
  public abstract readonly phase: VerifierPhase;
  public abstract verify(context: VerificationContext): void;
}

export class VerifierManager {
  private verifiers: Verifier[] = [];

  public register(verifier: Verifier): void {
    this.verifiers.push(verifier);
  }

  public runPhase(phase: VerifierPhase, context: VerificationContext): void {
    const errors: Error[] = [];
    for (const verifier of this.verifiers) {
      if (verifier.phase === phase) {
        try {
          verifier.verify(context);
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }
    if (errors.length > 0) {
      throw new Error(`Verification failed in phase ${phase}: ${errors.map(e => e.message).join('; ')}`);
    }
  }

  public verifyAll(context: VerificationContext): void {
    const errors: Error[] = [];
    for (const verifier of this.verifiers) {
      try {
        verifier.verify(context);
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }
    if (errors.length > 0) {
      throw new Error(`Verification failed: ${errors.map(e => e.message).join('; ')}`);
    }
  }
}

export class CFGVerifier extends Verifier {
  public readonly phase = VerifierPhase.PreOptimization;

  public static verify(cfg: ControlFlowGraph): void {
    new CFGVerifier().verify({ cfg });
  }

  public verify(context: VerificationContext): void {
    const cfg = context.cfg;
    const entryBlock = cfg.blocks.get(cfg.entryBlock);
    if (entryBlock && entryBlock.predecessors.length > 0) {
      throw new Error(`CFG Invariant violated: entry block ${cfg.entryBlock} has predecessor blocks`);
    }

    const exitBlock = cfg.blocks.get(cfg.exitBlock);
    if (exitBlock && exitBlock.successors.length > 0) {
      throw new Error(`CFG Invariant violated: exit block ${cfg.exitBlock} has successor blocks`);
    }

    for (const [blockId, block] of cfg.blocks) {
      for (const succ of block.successors) {
        const succBlock = cfg.blocks.get(succ);
        if (!succBlock) {
          throw new Error(`CFG Invariant violated: block ${blockId} points to non-existent successor block ${succ}`);
        }
        if (!succBlock.predecessors.includes(blockId)) {
          throw new Error(`CFG Invariant violated: block ${succ} is successor of ${blockId} but does not list it as predecessor`);
        }
      }
      for (const pred of block.predecessors) {
        const predBlock = cfg.blocks.get(pred);
        if (!predBlock) {
          throw new Error(`CFG Invariant violated: block ${blockId} lists non-existent predecessor block ${pred}`);
        }
        if (!predBlock.successors.includes(blockId)) {
          throw new Error(`CFG Invariant violated: block ${pred} is predecessor of ${blockId} but does not list it as successor`);
        }
      }

      if (block.instructions.length === 0) {
        throw new Error(`CFG Invariant violated: basic block ${blockId} is empty and lacks a terminator`);
      }

      let foundTerminator = false;
      for (let i = 0; i < block.instructions.length; i++) {
        const inst = block.instructions[i];
        const isTerm = inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return';
        if (foundTerminator) {
          throw new Error(`CFG Invariant violated: instruction placed after terminator in block ${blockId}`);
        }
        if (isTerm) {
          foundTerminator = true;
          if (i !== block.instructions.length - 1) {
            throw new Error(`CFG Invariant violated: terminator instruction is not the last instruction in block ${blockId}`);
          }
        }
      }

      if (!foundTerminator && block.successors.length > 0) {
        throw new Error(`CFG Invariant violated: block ${blockId} has successors but no terminator instruction`);
      }
    }
  }
}

export class SSAVerifier extends Verifier {
  public readonly phase = VerifierPhase.PostOptimization;

  public static verify(cfg: ControlFlowGraph, dom: DominatorTree): void {
    new SSAVerifier().verify({ cfg, dom });
  }

  public verify(context: VerificationContext): void {
    const cfg = context.cfg;
    const dom = context.dom;
    if (!dom) {
      throw new Error("SSAVerifier requires DominatorTree in verification context");
    }

    const defs = new Set<number>();
    const defBlockMap = new Map<number, number>();

    for (const [blockId, block] of cfg.blocks) {
      let seenNonPhi = false;
      for (const inst of block.instructions) {
        if (inst.kind === 'Phi') {
          if (seenNonPhi) {
            throw new Error(`SSA Invariant violated: Phi instruction placed after non-Phi instruction in block ${blockId}`);
          }
          if (defs.has(inst.target)) {
            throw new Error(`SSA Invariant violated: SSA value v${inst.target} is defined multiple times`);
          }
          defs.add(inst.target);
          defBlockMap.set(inst.target, blockId);
        } else if (inst.kind === 'Assign') {
          if (defs.has(inst.target)) {
            throw new Error(`SSA Invariant violated: SSA value v${inst.target} is defined multiple times`);
          }
          defs.add(inst.target);
          defBlockMap.set(inst.target, blockId);
          seenNonPhi = true;
        } else {
          seenNonPhi = true;
        }
      }
    }

    for (const [blockId, block] of cfg.blocks) {
      for (const inst of block.instructions) {
        if (inst.kind === 'Assign') {
          if (inst.value.kind === 'SSAValue') {
            const defVal = inst.value.id;
            if (!defs.has(defVal)) {
              throw new Error(`SSA Invariant violated: undefined SSA value usage v${defVal}`);
            }
            const defBlock = defBlockMap.get(defVal)!;
            if (!dom.dominates(defBlock, blockId)) {
              throw new Error(`SSA Invariant violated: usage of v${defVal} in block ${blockId} is not dominated by its definition block ${defBlock}`);
            }
          }
        } else if (inst.kind === 'Phi') {
          if (inst.incoming.size !== block.predecessors.length) {
            throw new Error(`SSA Invariant violated: Phi incoming size does not match predecessor count`);
          }
          for (const [predId, operand] of inst.incoming) {
            if (!block.predecessors.includes(predId)) {
              throw new Error(`SSA Invariant violated: Phi incoming predecessor ${predId} is not a predecessor of block ${blockId}`);
            }
            if (operand.kind === 'SSAValue') {
              const defVal = operand.id;
              if (!defs.has(defVal)) {
                throw new Error(`SSA Invariant violated: undefined SSA value usage in Phi v${defVal}`);
              }
              const defBlock = defBlockMap.get(defVal)!;
              if (!dom.dominates(defBlock, predId)) {
                throw new Error(`SSA Invariant violated: usage of v${defVal} for predecessor block ${predId} in Phi is not dominated by its definition block ${defBlock}`);
              }
            }
          }
        }
      }
    }
  }
}

export interface EffectAnalysis {
  isSpeculatable(inst: Instruction): boolean;
}

export class AliasAnalysis {
  public static mayAlias(ptr1: string, ptr2: string): boolean {
    return true;
  }
}
