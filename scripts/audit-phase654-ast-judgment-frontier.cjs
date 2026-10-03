const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const astPath = path.join(root, 'packages/core/src/types/upstream/ast.ts');
const canonicalPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/expressionAstCanonical.ts');
const ast = fs.readFileSync(astPath, 'utf8');
const canonical = fs.readFileSync(canonicalPath, 'utf8');

const required = [
  'identity', 'semantic', 'evidence', 'provenance', 'constraints',
  'dependencies', 'relations', 'derivation', 'status', 'diagnostics',
];
const relationNames = [
  'ast_syntax_surface', 'ast_syntax_fact', 'ast_semantic_term',
  'ast_requires', 'ast_excludes', 'ast_satisfies', 'ast_depends_on',
  'ast_derives', 'ast_witnesses', 'ast_rewrites_to', 'ast_status',
];
const diagnosticKinds = [
  'ast_syntax_error', 'ast_unsupported_surface',
  'ast_unresolved_semantics', 'ast_ambiguous_semantics',
];

const zero = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.ts') || file.endsWith('.tsx')) zero.push(file);
  }
}
walk(path.join(root, 'packages'));
const zeroFiles = zero.filter(file => fs.statSync(file).size === 0);
const sourceFiles = zero.filter(file => fs.statSync(file).size > 0);
const directRefs = new Map(zeroFiles.map(file => [file, []]));
const importPattern = /(?:from\s*["'](\.[^"']+)["']|import\s*["'](\.[^"']+)["']|require\(\s*["'](\.[^"']+)["']\s*\))/g;
const resolveModule = (base) => {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js')];
  return candidates.find(candidate => fs.existsSync(candidate));
};
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importPattern.exec(text))) {
    const specifier = match[1] || match[2] || match[3];
    const resolved = resolveModule(path.resolve(path.dirname(file), specifier));
    if (resolved && directRefs.has(resolved)) directRefs.get(resolved).push(path.relative(root, file));
  }
}

const scopedRoots = [
  'packages/core/src/compiler/scanner',
  'packages/core/src/compiler/analysis',
  'packages/core/src/graph',
  'packages/core/src/compiler/domain/common/ts-lowerer',
];
const banned = /\b(if|while|for|switch)\b|\.(map|filter|reduce|flatMap)\(|\bundefined\b|\?\?|===|!==|as unknown|\bSet\b|\bMap\b|\bany\b|\bnew\b/gi;
const frontier = [];
function scanScoped(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scanScoped(file);
    else if (/\.ts$/.test(entry.name) && !/\.(test|spec)\.ts$/.test(entry.name) && fs.statSync(file).size > 0) {
      const text = fs.readFileSync(file, 'utf8');
      const matches = text.match(banned);
      if (matches?.length) frontier.push({ file: path.relative(path.join(root, 'packages/core/src'), file), count: matches.length });
    }
  }
}
for (const rootPath of scopedRoots) scanScoped(path.join(root, rootPath));
frontier.sort((a, b) => b.count - a.count);

const result = {
  phase: 654,
  model: 'closed proof-carrying semantic AST judgment algebra',
  interface: {
    requiredFields: required,
    allRequiredFieldsPresent: required.every(field => ast.includes(`readonly ${field}:`)),
    closedRelationVocabulary: relationNames.every(name => ast.includes(`'${name}'`)),
    diagnosticsAreADT: diagnosticKinds.every(kind => ast.includes(`'${kind}'`)),
    routeSemanticPayloadIsDefinition: ast.includes("readonly route_ast: { readonly semantic: RouteDefinition;") ,
    genericPayloadSchemaRemoved: ast.includes('export type SemanticAstNode<Kind extends AstSemanticSchemaKind> ='),
  },
  canonicalBoundary: {
    hasRelationFacts: canonical.includes('relations:'),
    hasDiagnostics: canonical.includes('diagnostics:'),
    derivationCarriesPremises: canonical.includes('premises:'),
    derivationCarriesRound: canonical.includes('round:'),
  },
  inactiveVacuum: {
    zeroByteFiles: zeroFiles.map(file => path.relative(root, file)),
    directlyReferencedZeroByteFiles: [...directRefs.entries()].filter(([, refs]) => refs.length).map(([file, refs]) => ({ file: path.relative(root, file), refs })),
    unreferencedZeroByteFiles: [...directRefs.entries()].filter(([, refs]) => !refs.length).map(([file]) => path.relative(root, file)),
  },
  frontier: frontier.slice(0, 25),
  interpretation: 'Lexical frontier is diagnostic only; source syntax evidence and target projection are not semantic-authority violations by themselves.',
};
console.log(JSON.stringify(result, null, 2));
