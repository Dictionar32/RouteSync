<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProdukItemResource;
use App\Models\ProdukItemFrontend;
use App\Models\ProdukItem;
use Illuminate\Http\Request;
use App\Attributes\Response;

class ProdukController extends Controller
{
    /**
     * List produk (guest boleh)
     */



    #[Response(ProdukItem::class, collection: true)]
    public function index(Request $request)
    {
        $query = ProdukItem::query()
            ->with(['category', 'frontend'])
            ->where('stok', '>', 0);

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->toString();

            $query->where(function ($builder) use ($search) {
                $builder->where('nama', 'like', "%{$search}%")
                    ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('kategori')) {
            $query->whereHas('category', function ($builder) use ($request) {
                $builder->where('nama', $request->kategori);
            });
        }

        match ($request->get('sort', 'latest')) {
            'price_asc' => $query->orderBy('harga'),
            'price_desc' => $query->orderByDesc('harga'),
            'rating' => $query->orderByDesc(
                ProdukItemFrontend::select('rating')
                    ->whereColumn('produk_item_id', 'produk_items.id')
                    ->limit(1)
            ),
            default => $query->latest(),
        };

        $produk = $query->get();

        return ProdukItemResource::collection($produk);
    }

    /**
     * Detail produk (guest boleh)
     */



    #[Response(ProdukItem::class)]
    public function show($id)
    {
        $produk = ProdukItem::with(['category', 'frontend'])->findOrFail($id);

        return new ProdukItemResource($produk);
    }




    #[Response(ProdukItem::class)]
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string',
            'deskripsi' => 'nullable|string',
            'gambar' => 'nullable|string',
            'category_id' => 'required|integer|exists:categories,id',
            'harga' => 'required|integer|min:0',
            'stok' => 'required|integer|min:0',
            'rating' => 'nullable|numeric|min:0|max:5',
            'jumlah_review' => 'nullable|integer|min:0',
        ]);

        $produk = ProdukItem::create([
            'nama' => $request->nama,
            'deskripsi' => $request->deskripsi,
            'category_id' => $request->category_id,
            'harga' => $request->harga,
            'stok' => $request->stok,
        ]);

        $produk->frontend()->updateOrCreate(
            ['produk_item_id' => $produk->id],
            [
                'gambar' => $request->gambar,
                'rating' => $request->rating ?? 0,
                'jumlah_review' => $request->jumlah_review ?? 0,
            ]
        );

        return response()->json(new ProdukItemResource($produk->load(['category', 'frontend'])), 201);
    }
}
