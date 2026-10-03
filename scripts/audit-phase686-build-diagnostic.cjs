const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/relationalSequence.ts',
  'packages/core/src/semantic/kernel/relationMembership.ts',
  'packages/core/src/compiler/relational/sequence.ts',
  'packages/core/src/compiler/types/SemanticType.ts',
  'packages/core/src/compiler/utils/graph/dependencyGraph.ts',
  'packages/core/src/compiler/utils/graph/graphAlgorithms.ts',
  'packages/core/src/compiler/passes/CompilationState.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeSyntaxSemanticInterface.ts',
  'packages/core/src/compiler/scanner/lexer/phpMethodParser.ts',
  'packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/FormRequestScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/migrationAstCanonical.ts',
  'packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts',
  'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  'packages/core/src/compiler/scanner/symbols/ModelSymbolTable.ts',
  'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts',
  'packages/core/src/types/upstream/model.ts',
  'packages/core/src/graph/ServiceGraphBuilder.ts',
];
const forbidden = [
  ['host:new', /\bnew\s+[A-Za-z_$]/g],
  ['host:undefined', /\bundefined\b/g],
  ['host:null', /\bnull\b/g],
  ['host:unknown', /\bunknown\b/g],
  ['host:??', /\?\?/g],
  ['host:as-unknown', /\bas\s+unknown\b/g],
  ['host:===', /===/g],
  ['host:map', /\.map\s*\(/g],
  ['host:filter', /\.filter\s*\(/g],
  ['host:reduce', /\.reduce\s*\(/g],
  ['host:flatMap', /\.flatMap\s*\(/g],
  ['host:for', /\bfor\s*\(/g],
  ['host:while', /\bwhile\s*\(/g],
  ['host:switch', /\bswitch\s*\(/g],
  ['host:set', /\bSet\s*\(/g],
  ['host:any', /:\s*any\b/g],
];
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
const diagnostics=[]; const leaks=[];
for (const rel of files) {
  const file=path.join(root,rel); const source=fs.readFileSync(file,'utf8');
  const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,strict:true},reportDiagnostics:true});
  for (const d of out.diagnostics??[]) diagnostics.push({file:rel,message:ts.flattenDiagnosticMessageText(d.messageText,' ')});
  const clean=strip(source);
  for (const [name,re] of forbidden) { const hits=clean.match(re)||[]; if(hits.length) leaks.push({file:rel,construct:name,count:hits.length}); }
}
const kernel=fs.readFileSync(path.join(root,'packages/core/src/semantic/kernel/relationalSequence.ts'),'utf8');
for (const name of ['relationUnique','relationIndexAdd','relationIndexLookup','expandRelation']) if(!new RegExp(`(?:export\\s+(?:const|function|type)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b)`, 's').test(kernel)) diagnostics.push({file:'packages/core/src/semantic/kernel/relationalSequence.ts',message:`missing canonical export ${name}`});
const symbol=fs.readFileSync(path.join(root,'packages/core/src/compiler/scanner/symbols/ModelSymbolTable.ts'),'utf8');
if(!/createModelSymbolTable/.test(symbol)) diagnostics.push({file:'packages/core/src/compiler/scanner/symbols/ModelSymbolTable.ts',message:'missing createModelSymbolTable boundary export'});
console.log(JSON.stringify({phase:686,kind:'build-diagnostic-interface-trace',files:files.length,transpileDiagnostics:diagnostics,forbiddenHostLeaks:leaks,tscBlockedByMissingEnvironment:true,status:diagnostics.length?'FAIL':'PASS'},null,2));
process.exit(diagnostics.length?1:0);
