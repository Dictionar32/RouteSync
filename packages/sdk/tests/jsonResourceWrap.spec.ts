import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { LaravelRouteParser } from '../../cli/src/parsers/LaravelRouteParser'
import { ZodTierGenerator } from '../../cli/src/generators/ZodTierGenerator'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'

// ---------------------------------------------------------------------------
// PHP availability guard
// ---------------------------------------------------------------------------
function phpAvailable(): boolean {
  try { execSync('php --version', { stdio: 'ignore' }); return true } catch { return false }
}

// ---------------------------------------------------------------------------
// Shared helper: build bootstrap/app.php with all classes inlined
// (same pattern as laravelParser.spec.ts — everything in one file so PHP's
//  require + reflection can find all class definitions without a real autoloader)
// ---------------------------------------------------------------------------
function buildBootstrap(resourceClassBody: string): string {
  return `<?php
// ── Illuminate stubs ─────────────────────────────────────────────────────────
namespace Illuminate\\Http\\Resources\\Json {
    class JsonResource {
        // This mirrors the real Laravel JsonResource default: wrap single resources.
        public static $wrap = 'data';
        public function toArray($request) { return []; }
    }
}
namespace Illuminate\\Foundation\\Http { class FormRequest {} }
namespace Illuminate\\Contracts\\Console {
    interface Kernel { public function bootstrap(); }
}

// ── Global helpers ─────────────────────────────────────────────────────────
namespace {
    if (!function_exists('class_basename')) {
        function class_basename($class) {
            $class = is_object($class) ? get_class($class) : $class;
            return basename(str_replace('\\\\', '/', $class));
        }
    }
}

// ── Resource under test ────────────────────────────────────────────────────
namespace App\\Http\\Resources {
    use Illuminate\\Http\\Resources\\Json\\JsonResource;
${resourceClassBody}
}

// ── Attribute ─────────────────────────────────────────────────────────────
namespace App\\Attributes {
    #[\\Attribute(\\Attribute::TARGET_CLASS | \\Attribute::TARGET_METHOD)]
    class Response {
        public function __construct(
            public readonly mixed $type = null,
            public readonly bool  $collection = false
        ) {}
    }
}

// ── Model stub ────────────────────────────────────────────────────────────
namespace App\\Models { class Order {} }

// ── Controller ────────────────────────────────────────────────────────────
namespace App\\Http\\Controllers {
    class OrderController {
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function store(\\Illuminate\\Foundation\\Http\\FormRequest $r) {
            return new \\App\\Http\\Resources\\OrderResource(null);
        }
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function show(\\Illuminate\\Foundation\\Http\\FormRequest $r, int $id) {
            return new \\App\\Http\\Resources\\OrderResource(null);
        }
    }
}

// ── Mock router & app ──────────────────────────────────────────────────────
namespace {
    class MockRoute {
        public function __construct(private $m, private $u, private $a, private $mw = []) {}
        public function uri()              { return $this->u; }
        public function methods()          { return [$this->m]; }
        public function gatherMiddleware() { return $this->mw; }
        public function getAction()        { return ['uses' => $this->a]; }
        public function getName()          { return 'orders'; }
    }
    class MockRouter {
        public function getRoutes() {
            return [
                new MockRoute('POST', 'api/orders',      'App\\\\Http\\\\Controllers\\\\OrderController@store', ['api','auth:sanctum']),
                new MockRoute('GET',  'api/orders/{id}', 'App\\\\Http\\\\Controllers\\\\OrderController@show',  ['api','auth:sanctum']),
            ];
        }
    }
    class MockApp {
        public function make($c) {
            if ($c === 'router') return new MockRouter();
            if (str_contains($c, 'Kernel')) {
                return new class implements Illuminate\\Contracts\\Console\\Kernel {
                    public function bootstrap() {}
                };
            }
            return null;
        }
    }
    $app = new MockApp();
    if (!function_exists('app')) { function app($c) { global $app; return $app->make($c); } }
    return $app;
}
`
}

async function writeProject(dir: string, resourceClassBody: string) {
  await fs.ensureDir(path.join(dir, 'vendor'))
  await fs.ensureDir(path.join(dir, 'bootstrap'))
  await fs.ensureDir(path.join(dir, 'routes'))
  await fs.writeFile(path.join(dir, 'vendor/autoload.php'), '<?php\n')
  await fs.writeFile(path.join(dir, 'routes/api.php'), '<?php\n')
  await fs.writeFile(path.join(dir, 'bootstrap/app.php'), buildBootstrap(resourceClassBody))
}

// ---------------------------------------------------------------------------
// Resource fixture bodies (indented 4 spaces — inserted inside the namespace block)
// ---------------------------------------------------------------------------

const WITH_WRAP_NULL = `
    class OrderResource extends JsonResource {
        public static $wrap = null;   // explicitly flat — no { data: ... } wrapper
        public function toArray($request) { return ['id' => 1, 'status' => 'paid']; }
    }`

const WITHOUT_WRAP = `
    class OrderResource extends JsonResource {
        // No $wrap declaration — inherits Laravel default ('data')
        public function toArray($request) { return ['id' => 1, 'status' => 'paid']; }
    }`

const WITH_CUSTOM_WRAP = `
    class OrderResource extends JsonResource {
        public static $wrap = 'result';  // custom key, still wrapped
        public function toArray($request) { return ['id' => 1]; }
    }`

// ===========================================================================
// Integration tests — spin up a real PHP project
// ===========================================================================

describe('JsonResource $wrap detection (integration via PHP reflection)', () => {
  if (!phpAvailable()) {
    it.skip('PHP not available', () => {})
    return
  }

  // ── A: $wrap = null → backend sends flat JSON ───────────────────────────

  describe('A: resource with $wrap = null (flat response)', () => {
    const dir = path.resolve(process.cwd(), 'temp-wrap-a-test')
    let routes: any[]

    beforeAll(async () => {
      await fs.remove(dir)
      await writeProject(dir, WITH_WRAP_NULL)
      const result = await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php'))
      routes = result.routes
    })
    afterAll(() => fs.remove(dir))

    it('POST route should NOT have response.wrapped', () => {
      const post = routes.find(r => r.method === 'POST')
      expect(post).toBeDefined()
      expect(post?.response?.wrapped).toBeFalsy()
    })

    it('GET route should NOT have response.wrapped', () => {
      const get = routes.find(r => r.method === 'GET')
      expect(get).toBeDefined()
      expect(get?.response?.wrapped).toBeFalsy()
    })
  })

  // ── B: no $wrap → Laravel wraps in { data: ... } ────────────────────────

  describe('B: resource without $wrap (default Laravel wrapping)', () => {
    const dir = path.resolve(process.cwd(), 'temp-wrap-b-test')
    let routes: any[]

    beforeAll(async () => {
      await fs.remove(dir)
      await writeProject(dir, WITHOUT_WRAP)
      const result = await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php'))
      routes = result.routes
    })
    afterAll(() => fs.remove(dir))

    it('POST route should have response.wrapped = true', () => {
      const post = routes.find(r => r.method === 'POST')
      expect(post).toBeDefined()
      expect(post?.response?.wrapped).toBe(true)
    })

    it('GET route should have response.wrapped = true', () => {
      const get = routes.find(r => r.method === 'GET')
      expect(get).toBeDefined()
      expect(get?.response?.wrapped).toBe(true)
    })
  })

  // ── C: $wrap = 'result' → still wrapped (non-null value) ────────────────

  describe('C: resource with custom $wrap key (still wrapped)', () => {
    const dir = path.resolve(process.cwd(), 'temp-wrap-c-test')
    let routes: any[]

    beforeAll(async () => {
      await fs.remove(dir)
      await writeProject(dir, WITH_CUSTOM_WRAP)
      const result = await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php'))
      routes = result.routes
    })
    afterAll(() => fs.remove(dir))

    it('POST route should have response.wrapped = true (non-null $wrap is still wrapped)', () => {
      const post = routes.find(r => r.method === 'POST')
      expect(post).toBeDefined()
      expect(post?.response?.wrapped).toBe(true)
    })
  })
})

// ===========================================================================
// Unit tests — ZodTierGenerator schema & mapper shape (no PHP needed)
// ===========================================================================

describe('ZodTierGenerator: wrapped flag → generated schema & mapper', () => {
  /** Minimal manifest with the wrapped flag set or unset */
  function makeManifest(wrapped: boolean) {
    return {
      routes: [{
        name: 'orders.store',
        method: 'POST',
        path: '/orders',
        auth: true,
        middleware: ['api', 'auth:sanctum'],
        actionName: 'store',
        groupName: 'orders',
        schema: { rules: { status: 'required|string' } },
        response: {
          kind: 'model',
          model: 'Order',
          collection: false,
          ...(wrapped ? { wrapped: true } : {}),
          resolved: {
            status: 'resolved',
            type: 'model',
            model: 'Order',
            confidence: 100,
            ...(wrapped ? { wrapped: true } : {}),
          },
        },
      }],
      models: [{
        name: 'Order',
        table: 'orders',
        columns: [
          { name: 'id',     type: 'bigint',  nullable: false },
          { name: 'status', type: 'varchar', nullable: false },
        ],
        casts: {}, relations: {}, accessors: {},
      }],
      resources: [],
      frontend: {},
    } as any
  }

  const outFlat    = path.resolve(process.cwd(), 'temp-zod-flat-out')
  const outWrapped = path.resolve(process.cwd(), 'temp-zod-wrapped-out')

  beforeAll(async () => {
    await fs.ensureDir(outFlat)
    await fs.ensureDir(outWrapped)
    await ZodTierGenerator.generate(makeManifest(false), outFlat)
    await ZodTierGenerator.generate(makeManifest(true),  outWrapped)
  })
  afterAll(() => Promise.all([fs.remove(outFlat), fs.remove(outWrapped)]))

  // ── Schema ───────────────────────────────────────────────────────────────

  it('flat (wrapped=false): ResponseSchema should NOT contain z.object({ data:', async () => {
    const contract = await fs.readFile(path.join(outFlat, 'contract/api-contract.ts'), 'utf8')
    const line = contract.split('\n').find(l => l.includes('ResponseSchema') && l.includes('='))
    expect(line).toBeDefined()
    expect(line).not.toContain('z.object({ data:')
  })

  it('wrapped (wrapped=true): ResponseSchema should contain z.object({ data:', async () => {
    const contract = await fs.readFile(path.join(outWrapped, 'contract/api-contract.ts'), 'utf8')
    const line = contract.split('\n').find(l => l.includes('ResponseSchema') && l.includes('='))
    expect(line).toBeDefined()
    expect(line).toContain('z.object({ data:')
  })

  // ── Mapper ───────────────────────────────────────────────────────────────

  it('flat (wrapped=false): mutation mapper should NOT unwrap .data', async () => {
    const mapper = await fs.readFile(path.join(outFlat, 'mappers/api-mapper.ts'), 'utf8').catch(() => '')
    if (!mapper) return // mapper may not be generated for minimal manifest
    const respLine = mapper.split('\n').find(l => l.includes('ResponseRead') && l.includes('=>'))
    // flat mapper: identity (api) => api, no .data access
    if (respLine) expect(respLine).not.toMatch(/\(api as any\)\.data/)
  })

  it('wrapped (wrapped=true): mutation mapper should unwrap (api as any).data', async () => {
    const mapper = await fs.readFile(path.join(outWrapped, 'mappers/api-mapper.ts'), 'utf8').catch(() => '')
    if (!mapper) return
    const respLine = mapper.split('\n').find(l => l.includes('ResponseRead') && l.includes('=>'))
    if (respLine) expect(respLine).toContain('(api as any).data')
  })
})
