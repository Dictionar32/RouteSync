<?php

namespace App\Http\Controllers;

use App\Models\OrderDetail;
use App\Models\ProductReview;
use App\Models\ProdukItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductReviewController extends Controller
{
    public function index(Request $request, int $produkId)
    {
        ProdukItem::findOrFail($produkId);

        $perPage = max(1, min((int) $request->query('per_page', 10), 50));

        $summary = ProductReview::where('produk_item_id', $produkId)
            ->selectRaw('COALESCE(ROUND(AVG(rating), 2), 0) as avg_rating, COUNT(*) as total_review')
            ->first();

        $reviews = ProductReview::where('produk_item_id', $produkId)
            ->with('user:id,name')
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'summary' => [
                'avg_rating' => (float) ($summary->avg_rating ?? 0),
                'total_review' => (int) ($summary->total_review ?? 0),
            ],
            'reviews' => $reviews,
        ]);
    }

    public function store(Request $request, int $produkId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'nullable|string',
        ]);

        $produk = ProdukItem::findOrFail($produkId);

        return DB::transaction(function () use ($request, $produk) {
            $verifiedPurchase = OrderDetail::where('produk_item_id', $produk->id)
                ->whereHas('order', function ($query) use ($request) {
                    $query->where('user_id', $request->user()->id)
                        ->where('status', 'paid');
                })
                ->exists();

            $review = ProductReview::updateOrCreate(
                [
                    'produk_item_id' => $produk->id,
                    'user_id' => $request->user()->id,
                ],
                [
                    'rating' => $request->integer('rating'),
                    'title' => $request->input('title'),
                    'comment' => $request->input('comment'),
                    'is_verified_purchase' => $verifiedPurchase,
                ]
            );

            $summary = ProductReview::where('produk_item_id', $produk->id)
                ->selectRaw('COALESCE(ROUND(AVG(rating), 2), 0) as avg_rating, COUNT(*) as total_review')
                ->first();

            $produk->frontend()->updateOrCreate(
                ['produk_item_id' => $produk->id],
                [
                    'rating' => (float) ($summary->avg_rating ?? 0),
                    'jumlah_review' => (int) ($summary->total_review ?? 0),
                ]
            );

            return response()->json([
                'message' => 'Review tersimpan',
                'data' => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'comment' => $review->comment,
                    'is_verified_purchase' => $review->is_verified_purchase,
                    'created_at' => $review->created_at,
                ],
            ], 201);
        });
    }
}
