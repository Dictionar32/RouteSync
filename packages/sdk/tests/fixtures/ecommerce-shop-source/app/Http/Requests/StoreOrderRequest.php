<?php

namespace App\Http\Requests;

final class StoreOrderRequest
{
    public function rules(): array
    {
        return ['items.*.produk_item_id' => 'required'];
    }
}
