<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProdukItemResource;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use App\Attributes\Response;

class WishlistController extends Controller
{

    #[Response(ProdukItem::class, collection: true)]
    public function index(Request $request)
    {
        $items = Wishlist::where('user_id', $request->user()->id)
            ->with('produkItem.category', 'produkItem.frontend')
            ->latest()
            ->get()
            ->pluck('produkItem')
            ->filter()
            ->values();

        return ProdukItemResource::collection($items);
    }

    public function store(Request $request)
    {
        $request->validate([
            'produk_item_id' => 'required|integer|exists:produk_items,id',
        ]);

        Wishlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'produk_item_id' => $request->produk_item_id,
        ]);

        return response()->json([
            'message' => 'Produk ditambahkan ke wishlist',
        ], 201);
    }

    public function destroy(Request $request, int $produkItemId)
    {
        $deleted = Wishlist::where('user_id', $request->user()->id)
            ->where('produk_item_id', $produkItemId)
            ->delete();

        return response()->json([
            'message' => $deleted
                ? 'Produk dihapus dari wishlist'
                : 'Produk tidak ditemukan di wishlist',
        ]);
    }
}
