<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Http\Resources\OrderResource;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
final class OrderController
{
    #[Middleware('admin')]
    #[Authorize('update', [Order::class, 'order'])]
    public function update(Order $order): OrderResource
    {
        $order->recalculateTotal();
        return new OrderResource($order);
    }
}
