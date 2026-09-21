<?php

namespace Database\Seeders;

use App\Models\ProdukItem;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Database\Seeder;

class WishlistSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run DatabaseSeeder first to create users.');
            return;
        }

        $produkItems = ProdukItem::all();
        
        if ($produkItems->isEmpty()) {
            $this->command->warn('No produk items found. Please run ProdukItemSeeder first.');
            return;
        }

        // Add random wishlists for each user
        foreach ($users as $user) {
            // Get random subset of produk items for wishlist
            $randomProdukItems = $produkItems->random(min(3, $produkItems->count()));
            
            foreach ($randomProdukItems as $produkItem) {
                Wishlist::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'produk_item_id' => $produkItem->id,
                    ]
                );
            }
        }

        $this->command->info('WishlistSeeder completed successfully!');
    }
}
