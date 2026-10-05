const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'), 'utf8');
const flow = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts'), 'utf8');
const checks = {
  declarationFlowHasSemanticJudgment: /export interface RouteDeclarationFlow/.test(flow),
  scannerConsumesDeclarationFlow: /routeDeclarationFlow\(declaration\)/.test(scanner),
  targetComesFromFlow: /controllerNameOf\(declarationFlow\)/.test(scanner) && /flow\.target\.value/.test(scanner),
  methodComesFromFlow: /routeDeclarationSemanticKind\(declarationFlow\.method\)/.test(scanner),
  middlewareComesFromFlow: /declarationFlow\.middleware\.value/.test(scanner),
  groupPrefixComesFromFlow: /resolveRoutePath\(declaration\.path, declarationFlow\.group\.value\.prefix\)/.test(scanner),
  noDirectTargetSemanticRead: !/controllerNameOf\(declaration\)/.test(scanner),
  noDuplicateMiddlewareProjection: !/relationProject\(middlewares, value => createMiddlewareName/.test(scanner),
};
const pass = Object.values(checks).every(Boolean);
const report = { phase: 880, audit: 'route-declaration-upstream-wiring', checks, pass };
fs.writeFileSync(path.join(root, 'scripts/audits/phase880-route-declaration-upstream-wiring.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
