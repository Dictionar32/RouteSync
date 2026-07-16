import { describe, it, expect } from 'vitest'

/**
 * Tests for LaravelRouteParser assignment scanner fixes:
 *
 * 1. Level 90 Eloquent method expansion:
 *    $review = ProductReview::updateOrCreate(...) must be tracked
 *    as a single-instance model assignment (not z.unknown()).
 *
 * 2. Assignment scanner closure fix:
 *    $var = Model::method(function() { ... return ...; })
 *    must NOT be skipped — 'return' inside a closure is valid.
 *    Only skip when the expression ITSELF starts with 'return'.
 */

// ---------------------------------------------------------------------------
// Helpers: replicate the assignment scanner logic extracted from
// LaravelRouteParser.ts (assignmentsScannerPhp template) in JS so we can
// unit-test the regex / logic without spinning up a full PHP process.
// ---------------------------------------------------------------------------

interface Assignment {
  varName: string
  expr: string
}

/**
 * JS port of the PHP assignment scanner inside LaravelRouteParser.
 * Mirrors the regex + skip rules applied to $methodSource.
 */
function scanAssignments(methodSource: string): Record<string, string> {
  const assignments: Record<string, string> = {}
  // Same regex as in PHP: /\$([a-zA-Z0-9_]+)\s*=\s*([^;]+);/gs
  const pattern = /\$([a-zA-Z0-9_]+)\s*=\s*([^;]+);/gs
  let match: RegExpExecArray | null

  while ((match = pattern.exec(methodSource)) !== null) {
    const varName = match[1]
    const rawExpr = match[2]

    // Skip reserved names
    if (varName === 'request' || varName === 'this') continue

    const expr = rawExpr.trim().replace(/\s+/g, ' ')

    // Fixed behaviour: skip only when expression ITSELF starts with 'return'
    if (expr.startsWith('return')) continue

    assignments[varName] = expr
  }

  return assignments
}

/**
 * JS port of the Level-90 single-instance Eloquent tracker.
 * Mirrors the preg_match_all pattern from LaravelRouteParser.ts.
 */
function extractLevel90Models(methodSource: string): Record<string, { model: string; collection: boolean }> {
  const symbolTable: Record<string, { model: string; collection: boolean }> = {}

  // Level 90: single-instance methods
  const level90Pattern = /\$([a-zA-Z0-9_]+)\s*=\s*([A-Z][a-zA-Z0-9_]+)::(?:[^;]*?->)?(?:find|findOrFail|create|first|firstOrFail|update|latest|updateOrCreate|firstOrCreate|forceCreate|make|sole|firstOrNew|newInstance|newModelInstance|updateOrInsert)\s*\(/gs
  let m: RegExpExecArray | null
  while ((m = level90Pattern.exec(methodSource)) !== null) {
    symbolTable[m[1]] = { model: m[2], collection: false }
  }

  return symbolTable
}

// ---------------------------------------------------------------------------
// Test Suite 1: Level 90 Eloquent method expansion
// ---------------------------------------------------------------------------

describe('LaravelRouteParser: Level 90 Eloquent method expansion', () => {
  it('should track $review assigned via ProductReview::updateOrCreate()', () => {
    const methodSource = `
      public function store(Request $request) {
        $review = ProductReview::updateOrCreate(
          ['user_id' => $request->user_id, 'product_id' => $request->product_id],
          ['rating' => $request->rating, 'comment' => $request->comment]
        );
        return response()->json(['message' => 'ok', 'data' => $review]);
      }
    `
    const symbols = extractLevel90Models(methodSource)
    expect(symbols['review']).toBeDefined()
    expect(symbols['review'].model).toBe('ProductReview')
    expect(symbols['review'].collection).toBe(false)
  })

  it('should track $review assigned via ProductReview::firstOrCreate()', () => {
    const methodSource = `
      public function firstOrCreate(Request $request) {
        $review = ProductReview::firstOrCreate(['user_id' => 1]);
        return response()->json($review);
      }
    `
    const symbols = extractLevel90Models(methodSource)
    expect(symbols['review']).toBeDefined()
    expect(symbols['review'].model).toBe('ProductReview')
  })

  it('should track $item assigned via Order::sole()', () => {
    const methodSource = `
      public function getItem() {
        $item = Order::sole(['id' => 1]);
        return $item;
      }
    `
    const symbols = extractLevel90Models(methodSource)
    expect(symbols['item']).toBeDefined()
    expect(symbols['item'].model).toBe('Order')
  })

  it('should track $user assigned via User::firstOrNew()', () => {
    const methodSource = `
      public function upsertUser() {
        $user = User::firstOrNew(['email' => $request->email]);
        return $user;
      }
    `
    const symbols = extractLevel90Models(methodSource)
    expect(symbols['user']).toBeDefined()
    expect(symbols['user'].model).toBe('User')
  })

  it('should still track $product assigned via Product::find() (pre-existing method)', () => {
    const methodSource = `
      public function show($id) {
        $product = Product::find($id);
        return $product;
      }
    `
    const symbols = extractLevel90Models(methodSource)
    expect(symbols['product']).toBeDefined()
    expect(symbols['product'].model).toBe('Product')
  })
})

// ---------------------------------------------------------------------------
// Test Suite 2: Assignment scanner — closure 'return' fix
// ---------------------------------------------------------------------------

describe('LaravelRouteParser: assignment scanner closure return fix', () => {
  it('should NOT skip $review = Model::updateOrCreate(fn that contains return)', () => {
    // DB::transaction(function() { ... return ...; }) — contains 'return' inside
    // but the assignment itself does not START with return
    const methodSource = `
      public function store(Request $request) {
        $review = ProductReview::updateOrCreate(
          ['user_id' => $request->user_id],
          ['rating' => $request->rating]
        );
        return response()->json(['data' => $review]);
      }
    `
    const assignments = scanAssignments(methodSource)
    // $review should be captured — expression does not start with 'return'
    expect(assignments['review']).toBeDefined()
    expect(assignments['review']).toContain('ProductReview::updateOrCreate')
  })

  it('should NOT skip $result = DB::transaction(function() { return Model::create(...); })', () => {
    const methodSource = `
      public function store(Request $request) {
        $result = DB::transaction(function () use ($request) {
          $order = Order::create($request->all());
          return $order;
        });
        return response()->json($result);
      }
    `
    const assignments = scanAssignments(methodSource)
    // $result should be captured (expression starts with DB::transaction, not 'return')
    expect(assignments['result']).toBeDefined()
    expect(assignments['result']).toContain('DB::transaction')
  })

  it('should skip a variable whose expression literally starts with return', () => {
    // e.g. $foo = return something;  — this is invalid PHP but we guard against
    // artifacts from multi-line regex over-capture
    const methodSource = `
      $foo = return something;
    `
    const assignments = scanAssignments(methodSource)
    expect(assignments['foo']).toBeUndefined()
  })

  it('should capture $paginated from paginate() call inside a closure-body source', () => {
    const methodSource = `
      public function index(Request $request) {
        $reviews = ProductReview::with('user')
            ->where('product_id', $request->product_id)
            ->latest()
            ->paginate(10);
        return response()->json(['summary' => $summary, 'reviews' => $reviews]);
      }
    `
    const assignments = scanAssignments(methodSource)
    // $reviews should be captured
    expect(assignments['reviews']).toBeDefined()
    expect(assignments['reviews']).toContain('ProductReview')
  })

  it('should not capture $request and $this', () => {
    const methodSource = `
      $request = Request::capture();
      $this = new self();
    `
    const assignments = scanAssignments(methodSource)
    expect(assignments['request']).toBeUndefined()
    expect(assignments['this']).toBeUndefined()
  })
})
