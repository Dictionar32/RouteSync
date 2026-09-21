<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBuyNowRequest;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\ProdukItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Attributes\Response;

class OrderController extends Controller
{
    #[Response(Order::class, collection: true)]
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode'])
            ->latest()
            ->get();

        return OrderResource::collection($orders);
    }

    #[Response(Order::class)]
    public function show(Request $request, int $id)
    {
        $order = Order::where('user_id', $request->user()->id)
            ->with(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode'])
            ->findOrFail($id);

        return new OrderResource($order);
    }

    // =========================
    // Checkout / BuyNow version
    // =========================
    #[Response(Order::class)]
    public function store(StoreOrderRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $order = $this->getOrCreatePendingOrder($request);

            if ($request->filled('items')) {
                $this->syncOrderItems($order, $request->items);
            } elseif (!$order->details()->exists()) {
                abort(422, 'Keranjang kosong');
            }

            $this->syncShippingData($order, $request->only([
                'shipping_nama','shipping_telepon','shipping_alamat','shipping_kota','shipping_kode_pos'
            ]));

            $this->recalculateTotal($order);

            return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']));
        });
    }

    #[Response(Order::class)]
    public function buyNow(StoreBuyNowRequest $request)
    {
        return DB::transaction(function () use ($request) {
            // Pastikan hanya 1 produk
            if ($request->filled('items')) {
                abort(422, 'Buy Now hanya bisa untuk 1 produk.');
            }

            $order = $this->getOrCreatePendingOrder($request);

            // Lock produk untuk mencegah race condition
            $produk = ProdukItem::whereKey($request->produk_item_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($request->qty > $produk->stok) {
                abort(400, 'Stok tidak cukup untuk ' . $produk->nama);
            }

            // Kosongkan order detail sebelumnya
            $order->details()->delete();

            $order->details()->create([
                'produk_item_id' => $produk->id,
                'qty' => $request->qty,
                'harga' => $produk->harga,
            ]);

            $shippingData = $request->safe()->only([
                'shipping_nama',
                'shipping_telepon',
                'shipping_alamat',
                'shipping_kota',
                'shipping_kode_pos',
            ]);

            $this->syncShippingData($order, $shippingData);
            $this->recalculateTotal($order);

            $order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']);

            return new OrderResource($order);
        });
    }

    // =========================
    // Keranjang
    // =========================
    #[Response(Order::class)]
    public function keranjang(Request $request)
    {
        $order = $this->getPendingOrder($request);
        if (!$order || !$order->details()->exists()) {
            return response()->json(['message' => 'Keranjang kosong'], 200);
        }

        $this->recalculateTotal($order);

        return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']));
    }

    #[Response(Order::class)]
    public function addItem(StoreCartItemRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $order = $this->getOrCreatePendingOrder($request);

            $items = [
                ['produk_item_id' => $request->produk_item_id, 'qty' => $request->qty]
            ];

            $this->syncOrderItems($order, $items, true);

            $this->recalculateTotal($order);

            return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']));
        });
    }

    #[Response(Order::class)]
    public function updateItem(UpdateCartItemRequest $request, int $produkItemId)
    {
        return DB::transaction(function () use ($request, $produkItemId) {
            $order = $this->getPendingOrder($request);
            if (!$order) abort(404, 'Keranjang tidak ditemukan');

            $detail = $order->details()->where('produk_item_id', $produkItemId)->first();
            if (!$detail) abort(404, 'Item tidak ditemukan');

            $produk = ProdukItem::whereKey($produkItemId)->lockForUpdate()->firstOrFail();
            if ($request->qty > $produk->stok) abort(400, 'Stok tidak cukup untuk '.$produk->nama);

            $detail->update(['qty' => $request->qty, 'harga' => $produk->harga]);

            $this->recalculateTotal($order);

            return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']));
        });
    }

    #[Response(Order::class)]
    public function removeItem(Request $request, int $produkItemId)
    {
        return DB::transaction(function () use ($request, $produkItemId) {
            $order = $this->getPendingOrder($request);
            if (!$order) abort(404, 'Keranjang tidak ditemukan');

            $detail = $order->details()->where('produk_item_id', $produkItemId)->first();
            if (!$detail) abort(404, 'Item tidak ditemukan');

            $detail->delete();

            if (!$order->details()->exists()) {
                $order->delete();
                return response()->json(['message' => 'Keranjang kosong'], 200);
            }

            $this->recalculateTotal($order);

            return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']));
        });
    }

    public function clearCart(Request $request)
    {
        $order = $this->getPendingOrder($request);
        if ($order) $order->delete();

        return response()->json(['message' => 'Keranjang dikosongkan'], 200);
    }

    // =========================
    // Helper functions
    // =========================
    private function getOrCreatePendingOrder(Request $request): Order
    {
        return $this->getPendingOrder($request) ?? Order::create([
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);
    }

    private function getPendingOrder(Request $request): ?Order
    {
        return Order::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest()
            ->first();
    }

    private function syncOrderItems(Order $order, array $items, bool $merge = false): void
    {
        // Perbaikan bug grouping qty
        $grouped = collect($items)
            ->groupBy('produk_item_id')
            ->map(fn($g) => array_sum(array_column($g->toArray(), 'qty')));

        if (!$merge) $order->details()->delete();

        foreach ($grouped as $produkItemId => $qty) {
            $produk = ProdukItem::whereKey($produkItemId)->lockForUpdate()->firstOrFail();
            if ($qty > $produk->stok) abort(400, 'Stok tidak cukup untuk '.$produk->nama);

            $detail = $order->details()->where('produk_item_id', $produkItemId)->first();
            if ($detail) {
                $detail->update(['qty'=>$detail->qty+$qty, 'harga'=>$produk->harga]);
            } else {
                $order->details()->create([
                    'produk_item_id' => $produk->id,
                    'qty' => $qty,
                    'harga' => $produk->harga,
                ]);
            }
        }
    }

    private function recalculateTotal(Order $order): void
    {
        $subtotal = (int) $order->details()->sum(DB::raw('qty * harga'));
        $discount = $order->promotion?->discount_minor ?? 0;
        $shipping = $order->shipping?->shipping_minor ?? 0;
        $tax = $order->amount?->tax_minor ?? 0;

        $grand = max(0, $subtotal - $discount + $shipping + $tax);

        $order->update([
            'subtotal_minor'=>$subtotal,
            'discount_minor'=>$discount,
            'total_harga_minor'=>$grand,
            'total_harga'=>$grand,
        ]);
    }

    private function syncShippingData(Order $order, array $data): void
    {
        if (!array_filter($data)) return;

        $order->shipping()->updateOrCreate(['order_id'=>$order->id],[
            'nama'=>$data['shipping_nama']??null,
            'telepon'=>$data['shipping_telepon']??null,
            'alamat'=>$data['shipping_alamat']??null,
            'kota'=>$data['shipping_kota']??null,
            'kode_pos'=>$data['shipping_kode_pos']??null,
        ]);
    }
}