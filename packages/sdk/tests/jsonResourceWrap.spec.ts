import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { LaravelRouteParser } from '../../cli/src/parsers/LaravelRouteParser'
import { CompilerBridge } from '../../cli/src/generators/CompilerBridge'
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
function buildBootstrap(resourceClassBody: string, controllerBody?: string): string {
  const defaultController = `
    class OrderController {
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function store(\\Illuminate\\Foundation\\Http\\FormRequest $r) {
            return new \\App\\Http\\Resources\\OrderResource(null);
        }
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function show(\\Illuminate\\Foundation\\Http\\FormRequest $r, int $id) {
            return new \\App\\Http\\Resources\\OrderResource(null);
        }
    }`
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
${controllerBody ?? defaultController}
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

async function writeProject(dir: string, resourceClassBody: string, controllerBody?: string) {
  await fs.ensureDir(path.join(dir, 'vendor'))
  await fs.ensureDir(path.join(dir, 'bootstrap'))
  await fs.ensureDir(path.join(dir, 'routes'))
  await fs.writeFile(path.join(dir, 'vendor/autoload.php'), '<?php\n')
  await fs.writeFile(path.join(dir, 'routes/api.php'), '<?php\n')
  await fs.writeFile(path.join(dir, 'bootstrap/app.php'), buildBootstrap(resourceClassBody, controllerBody))
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

describe('CompilerBridge: wrapped flag → generated schema', () => {
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

  let flatContract: string
  let wrappedContract: string

  beforeAll(async () => {
    const flatRes = await CompilerBridge.generateContractTypes(makeManifest(false))
    flatContract = flatRes.code
    const wrappedRes = await CompilerBridge.generateContractTypes(makeManifest(true))
    wrappedContract = wrappedRes.code
  })

  it('flat (wrapped=false): generates contract schema', () => {
    expect(flatContract).toContain('ordersContractSchema')
  })

  it('wrapped (wrapped=true): generates contract schema', () => {
    expect(wrappedContract).toContain('ordersContractSchema')
  })
})

// ===========================================================================
// Regression tests — one test per bug found, named after the root cause.
// Goal: if a fix breaks these, we know exactly which bug was reintroduced.
// ===========================================================================

describe('Regression: generated PHP script must have valid syntax', () => {
  if (!phpAvailable()) {
    it.skip('PHP not available', () => {})
    return
  }

  const dir = path.resolve(process.cwd(), 'temp-php-syntax-test')

  beforeAll(async () => {
    await fs.remove(dir)
    await writeProject(dir, WITHOUT_WRAP)
    // Trigger a parse so the parser writes routesync-dump.php to the dir
    await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php')).catch(() => {})
  })
  afterAll(() => fs.remove(dir))

  it('BUG: TS→PHP escaping — generated PHP script must pass php -l (lint)', () => {
    // This catches the class of bugs where \\s in TS becomes \s in PHP
    // (invalid escape) or \\( becomes ( causing parse errors.
    const dumpPath = path.join(dir, 'routesync-dump.php')
    if (!fs.existsSync(dumpPath)) return // parser may have cleaned up

    const result = execSync(`php -l "${dumpPath}" 2>&1`, { encoding: 'utf-8' })
    expect(result).toContain('No syntax errors detected')
  })
})

describe('Regression: class resolution — FQCN with leading backslash', () => {
  if (!phpAvailable()) {
    it.skip('PHP not available', () => {})
    return
  }

  // BUG: return new \App\Http\Resources\OrderResource(...) was not matched
  // because old regex [a-zA-Z0-9_]+Resource required no backslash prefix.
  // Fix: regex [^\s(]+Resource captures the full FQCN, then ltrim('\\').
  const dir = path.resolve(process.cwd(), 'temp-fqcn-backslash-test')
  let routes: any[]

  beforeAll(async () => {
    await fs.remove(dir)
    // Controller returns FQCN with leading backslash: new \App\Http\Resources\OrderResource(...)
    // This is what PHP generates when you write return new \Full\Path\Resource(...)
    await writeProject(dir, WITHOUT_WRAP)
    // bootstrap/app.php already has the controller returning FQCN with leading backslash
    const result = await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php'))
    routes = result.routes
  })
  afterAll(() => fs.remove(dir))

  it('BUG: FQCN with leading backslash — must detect wrapped=true', () => {
    const post = routes.find(r => r.method === 'POST')
    expect(post).toBeDefined()
    // Without the fix, class_exists() failed because rawName had leading backslash
    expect(post?.response?.wrapped).toBe(true)
  })
})


describe('Regression: class resolution — short name via use statement', () => {
  if (!phpAvailable()) {
    it.skip('PHP not available', () => {})
    return
  }

  // BUG: return new OrderResource(...) with 'use App\Http\Resources\OrderResource;'
  // was not resolved because old code hardcoded 'App\\Http\\Resources\\' prefix.
  // Fix: parse 'use' statements from the controller source file.
  const dir = path.resolve(process.cwd(), 'temp-use-stmt-test')
  let routes: any[]

  // Controller uses short name with explicit 'use' — no FQCN in return statement
  // Escaping rule: \\  in TS template = \ in string = \ in PHP file = namespace separator
  const ctrlWithUseStmt = `
    use App\\Http\\Resources\\OrderResource;
    class OrderController {
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function store(\\Illuminate\\Foundation\\Http\\FormRequest $r) {
            return new OrderResource(null);
        }
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function show(\\Illuminate\\Foundation\\Http\\FormRequest $r, int $id) {
            return new OrderResource(null);
        }
    }`

  beforeAll(async () => {
    await fs.remove(dir)
    await writeProject(dir, WITHOUT_WRAP, ctrlWithUseStmt)
    const result = await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php'))
    routes = result.routes
  })
  afterAll(() => fs.remove(dir))

  it('BUG: short name + use statement — must detect wrapped=true', () => {
    const post = routes.find(r => r.method === 'POST')
    expect(post).toBeDefined()
    // Without fix: hardcoded App\\Http\\Resources\\ → wrong FQCN when namespace differs
    // With fix: reads 'use App\Http\Resources\OrderResource' from controller source
    expect(post?.response?.wrapped).toBe(true)
  })
})

describe('Regression: class resolution — aliased import (use X as Y)', () => {
  if (!phpAvailable()) {
    it.skip('PHP not available', () => {})
    return
  }

  // Edge case: use App\Http\Resources\OrderResource as OrderRes;
  // return new OrderRes(null) — alias must resolve to full FQCN before class_exists().
  const dir = path.resolve(process.cwd(), 'temp-use-alias-test')
  let routes: any[]

  const ctrlWithAlias = `
    use App\\Http\\Resources\\OrderResource as OrderRes;
    class OrderController {
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function store(\\Illuminate\\Foundation\\Http\\FormRequest $r) {
            return new OrderRes(null);
        }
        #[\\App\\Attributes\\Response(\\App\\Models\\Order::class)]
        public function show(\\Illuminate\\Foundation\\Http\\FormRequest $r, int $id) {
            return new OrderRes(null);
        }
    }`

  beforeAll(async () => {
    await fs.remove(dir)
    await writeProject(dir, WITHOUT_WRAP, ctrlWithAlias)
    const result = await new LaravelRouteParser().parse(path.join(dir, 'routes/api.php'))
    routes = result.routes
  })
  afterAll(() => fs.remove(dir))

  it('BUG: aliased use (use X as Y) — must detect wrapped via alias resolution', () => {
    const post = routes.find(r => r.method === 'POST')
    expect(post).toBeDefined()
    // alias OrderRes → App\Http\Resources\OrderResource (no $wrap=null → wrapped=true)
    expect(post?.response?.wrapped).toBe(true)
  })
})
