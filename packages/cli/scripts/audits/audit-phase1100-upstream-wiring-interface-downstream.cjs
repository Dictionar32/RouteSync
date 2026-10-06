const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const core = path.join(root, 'core');
const cli = path.join(root, 'cli');
const read = p => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const exists = p => fs.existsSync(p);
const runtimeAdapter = path.join(core, 'src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const runtimeComposition = path.join(core, 'src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const analyzer = read(path.join(core, 'src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts'));
const scan = read(path.join(cli, 'src/commands/scan.ts'));
const sync = read(path.join(cli, 'src/commands/sync.ts'));
const explain = read(path.join(cli, 'src/commands/explain.ts'));
const cliRuntime = read(path.join(cli, 'src/dataflow/semanticDataflowRuntimeBoundary.ts'));
const dataflow = read(path.join(core, 'src/types/dataflow/dataFlowInterface.ts'));
const boundary = read(path.join(core, 'src/types/interfaces/interfaceDependencyBoundary.ts'));
const report = {
  coreRuntimeImplementationEmpty: read(runtimeAdapter) === '' && read(runtimeComposition) === '',
  cliOwnsRuntimeImplementation: /cliSemanticDataflowRuntimeBoundary/.test(cliRuntime) && /DataFlowInterface/.test(cliRuntime),
  cliCommandsInjectRuntime: /cliSemanticDataflowRuntimeBoundary/.test(scan) && /cliSemanticDataflowRuntimeBoundary/.test(sync),
  scannerUsesUpstreamAuthority: /createSemanticDataflowJudgment\(input\)/.test(analyzer) && !/semanticDataflowRuntimeBoundary/.test(analyzer),
  explainDoesNotResolveSemantics: !/SemanticResolutionKernel|resolver\.resolve/.test(explain),
  dataflowGeneric: !/Laravel|Route|Controller|Request|Model|Resource|Schema|Graph|IR|StaticLaravelScanner/.test(dataflow),
  boundaryDirectional: /project:\s*\(upstream: Upstream\) => Downstream/.test(boundary),
  staticScannerAbsent: !exists(path.join(core, 'src/compiler/scanner/StaticLaravelScanner.ts')),
};
console.log(JSON.stringify(report, null, 2));
process.exit(Object.values(report).every(Boolean) ? 0 : 1);
