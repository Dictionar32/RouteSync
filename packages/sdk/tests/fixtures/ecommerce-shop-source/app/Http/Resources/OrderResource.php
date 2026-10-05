<?php

namespace App\Http\Resources;

use App\Models\Order;

final class OrderResource
{
    public function __construct(public readonly Order $order)
    {
    }
}
