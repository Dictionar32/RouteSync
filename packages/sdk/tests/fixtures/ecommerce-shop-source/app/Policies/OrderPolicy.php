<?php

namespace App\Policies;

use App\Models\Order;

final class OrderPolicy
{
    public function update(Order $order): bool
    {
        return true;
    }
}
