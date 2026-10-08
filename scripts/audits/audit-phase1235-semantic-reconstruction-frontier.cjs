const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const cli = path.join(root, 'packages', 'cli', 'src');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

const files = walk(cli);
const production = files.filter(p => !p.includes(`${path.sep}__tests__${path.sep}`));
const read = p => fs.readFileSync(p, 'utf8');
const text = production.map(p => ({ p, t: read(p) }));

const routeGrouper = path.join(cli, 'generators', 'classifier', 'routeGrouper.ts');
const routeProjection = path.join(cli, 'generators', 'classifier', 'routeCapabilityProjectionInterface.ts');
const grouperText = fs.existsSync(routeGrouper) ? read(routeGrouper) : '';
const projectionText = fs.existsSync(routeProjection) ? read(routeProjection) : '';

const forbiddenSemanticMethodHelpers = text.filter(({ p, t }) =>
  !p.endsWith(path.join('generators', 'canonical', 'actionMap.ts')) &&
  /\b(getActionFromMethod|isMutationAction)\s*\(/.test(t)
).map(({ p }) => path.relative(root, p));

const forbiddenRouteClassifierCalls = text.filter(({ p, t }) =>
  /\bclassifyRoutes\s*\(|\bclassifyDomainGraph\s*\(/.test(t) &&
  p !== routeGrouper
).map(({ p }) => path.relative(root, p));

const resolverReconstruction = text.filter(({ p, t }) =>
  /\b(IntentResolver|detectCartGroups|resolveCartModelInfo)\b/.test(t)
).map(({ p }) => path.relative(root, p));

const routeSemanticReads = text.filter(({ p, t }) =>
  /\b(?:route|r|freshRoute)\.(?:identity\.coordinates\.(?:method|path)|method|path)\s*(?:===|!==)/.test(t) &&
  !p.endsWith(path.join('generators', 'names.ts')) &&
  !p.endsWith(path.join('commands', 'audit', 'driftAuditor.ts')) &&
  !p.endsWith(path.join('generators', 'classifier', 'routeGrouper.ts'))
).map(({ p }) => path.relative(root, p));

const result = {
  routeProjectionUsesUpstreamWiring: /extends\s+UpstreamWiringInterface\s*<\s*RouteSemanticFlow\s*,\s*ClassifiedRoute\s*>/.test(projectionText),
  routeProjectionIsDirectional: /direction:\s*'upstream_to_downstream'/.test(grouperText) && /upstreamAuthority:\s*'upstream'/.test(grouperText),
  routeProjectionReadsClosedCrudRole: /route\.capability\.crudRole/.test(grouperText),
  noIntentResolverInProduction: resolverReconstruction.length === 0,
  noSemanticMethodHelperReconstruction: forbiddenSemanticMethodHelpers.length === 0,
  noLegacyClassifierCallsOutsideCompatibilityProjection: forbiddenRouteClassifierCalls.length === 0,
  noUnexpectedRouteSemanticReconstruction: routeSemanticReads.length === 0,
  details: {
    forbiddenSemanticMethodHelpers,
    forbiddenRouteClassifierCalls,
    resolverReconstruction,
    routeSemanticReads,
  },
};

const pass = Object.entries(result)
  .filter(([key]) => key !== 'details')
  .every(([, value]) => value === true);

console.log(JSON.stringify(result, null, 2));
console.log(`semantic-reconstruction-frontier: ${pass ? 'PASS' : 'FAIL'}`);
process.exitCode = pass ? 0 : 1;
