<?php

namespace Database\Seeders;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Database\Seeder;

class SocialAccountSeeder extends Seeder
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

        $socialAccounts = [
            [
                'provider' => 'google',
                'provider_user_id' => 'google_123456789',
                'email' => 'test@example.com',
                'avatar_url' => 'https://lh3.googleusercontent.com/a/default',
            ],
            [
                'provider' => 'facebook',
                'provider_user_id' => 'fb_987654321',
                'email' => 'test@example.com',
                'avatar_url' => 'https://graph.facebook.com/v12.0/default/picture',
            ],
            [
                'provider' => 'apple',
                'provider_user_id' => 'apple_555555555',
                'email' => 'test@example.com',
                'avatar_url' => null,
            ],
        ];

        // Assign social accounts to users
        foreach ($users as $index => $user) {
            if (isset($socialAccounts[$index])) {
                $account = $socialAccounts[$index];
                
                SocialAccount::updateOrCreate(
                    [
                        'provider' => $account['provider'],
                        'provider_user_id' => $account['provider_user_id'],
                    ],
                    [
                        'user_id' => $user->id,
                        'email' => $account['email'],
                        'avatar_url' => $account['avatar_url'],
                    ]
                );
            }
        }

        $this->command->info('SocialAccountSeeder completed successfully!');
    }
}
