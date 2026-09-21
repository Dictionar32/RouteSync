<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Throwable;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;

use App\Attributes\Response;
use App\Http\DTOs\RegisterResponse;

class AuthController extends Controller
{
    // REGISTER
    #[Response(RegisterResponse::class)]
    public function register(RegisterRequest $request)
{
    User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => 'user',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Register berhasil. Silakan login.',
        'data' => null,
    ]);
}

    // LOGIN
    public function login(LoginRequest $request){
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            abort(401, 'Invalid credentials');
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at?->toISOString(),
                    'updated_at' => $user->updated_at?->toISOString(),
                ],
            ],
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function oauthRedirect(Request $request, string $provider)
    {
        $provider = strtolower($provider);
        $this->assertProviderSupported($provider);
        $this->assertProviderConfigured($provider);

        $request->validate([
            'redirect_to' => 'nullable|url|max:2048',
        ]);

        $driver = $this->socialiteProvider($provider);
        $scopes = $this->resolveScopes($provider);

        if ($scopes !== []) {
            $this->applyScopes($driver, $scopes);
        }

        $redirectTo = $request->input('redirect_to') ?: config('services.oauth.frontend_redirect_default');
        if ($redirectTo) {
            $this->attachOauthState($driver, [
                'redirect_to' => $redirectTo,
            ]);
        }

        $targetUrl = $driver->redirect()->getTargetUrl();

        if ($request->boolean('json')) {
            return response()->json([
                'provider' => $provider,
                'auth_url' => $targetUrl,
            ]);
        }

        return redirect()->away($targetUrl);
    }

    public function oauthCallback(Request $request, string $provider)
    {
        $provider = strtolower($provider);
        $this->assertProviderSupported($provider);
        $this->assertProviderConfigured($provider);

        try {
            $socialiteUser = $this->socialiteProvider($provider)->user();
            $user = $this->upsertUserFromSocialite($provider, $socialiteUser);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'OAuth callback gagal diproses.',
                'error' => $exception->getMessage(),
            ], 422);
        }

        $token = $user->createToken('auth')->plainTextToken;
        $frontendRedirect = $this->extractFrontendRedirect($request);

        if ($frontendRedirect) {
            return redirect()->away(
                $this->buildFrontendRedirect($frontendRedirect, [
                    'token' => $token,
                    'provider' => $provider,
                    'user_id' => (string) $user->id,
                ])
            );
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at?->toISOString(),
                'updated_at' => $user->updated_at?->toISOString(),
            ],
        ]);
    }

    public function socialLogin(Request $request)
    {
        $request->validate([
            'provider' => 'required|in:google,facebook,apple',
            'provider_user_id' => 'required|string|max:191',
            'email' => 'required|email|max:255',
            'name' => 'nullable|string|max:255',
            'avatar_url' => 'nullable|url|max:2048',
        ]);

        $provider = $request->string('provider')->toString();
        $providerUserId = $request->string('provider_user_id')->toString();
        $email = $request->string('email')->toString();

        $user = DB::transaction(function () use ($provider, $providerUserId, $email, $request) {
            $existingSocial = SocialAccount::with('user')
                ->where('provider', $provider)
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($existingSocial) {
                return $existingSocial->user;
            }

            $user = User::where('email', $email)->first();

            if (! $user) {
                $user = User::create([
                    'name' => $request->name ?? Str::before($email, '@'),
                    'email' => $email,
                    'password' => Hash::make(Str::random(40)),
                    'role' => 'user',
                ]);
            }

            SocialAccount::firstOrCreate(
                [
                    'provider' => $provider,
                    'provider_user_id' => $providerUserId,
                ],
                [
                    'user_id' => $user->id,
                    'email' => $email,
                    'avatar_url' => $request->avatar_url,
                ]
            );

            return $user;
        });

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at?->toISOString(),
                'updated_at' => $user->updated_at?->toISOString(),
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $email = $request->string('email')->toString();
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $response = [
            'message' => 'Link reset password telah dibuat.',
        ];

        if (app()->environment(['local', 'development', 'testing'])) {
            $response['reset_token'] = $token;
        }

        return response()->json($response);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $email = $request->string('email')->toString();
        $reset = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (! $reset) {
            abort(422, 'Token reset tidak ditemukan.');
        }

        $createdAt = $reset->created_at ? Carbon::parse($reset->created_at) : null;
        if ($createdAt && $createdAt->lt(now()->subMinutes(60))) {
            abort(422, 'Token reset sudah kedaluwarsa.');
        }

        if (! Hash::check($request->token, $reset->token)) {
            abort(422, 'Token reset tidak valid.');
        }

        $user = User::where('email', $email)->firstOrFail();
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        DB::table('password_reset_tokens')
            ->where('email', $email)
            ->delete();

        return response()->json([
            'message' => 'Password berhasil diubah.',
        ]);
    }

    private function assertProviderSupported(string $provider): void
    {
        $allowed = ['google', 'facebook', 'apple'];

        if (! in_array($provider, $allowed, true)) {
            abort(404, 'Provider OAuth tidak didukung.');
        }
    }

    private function assertProviderConfigured(string $provider): void
    {
        $config = config("services.{$provider}", []);
        $required = ['client_id', 'client_secret', 'redirect'];

        foreach ($required as $key) {
            $value = $config[$key] ?? null;

            if (! is_string($value) || trim($value) === '') {
                abort(422, "Konfigurasi OAuth {$provider} belum lengkap. Missing: {$key}");
            }

            if (str_starts_with(strtoupper($value), 'YOUR_')) {
                abort(422, "Konfigurasi OAuth {$provider} masih placeholder. Ganti {$key} di .env.");
            }
        }
    }

    private function resolveScopes(string $provider): array
    {
        return match ($provider) {
            'google' => ['openid', 'email', 'profile'],
            'facebook' => ['email', 'public_profile'],
            'apple' => ['email', 'name'],
            default => [],
        };
    }

    private function upsertUserFromSocialite(
        string $provider,
        \Laravel\Socialite\Contracts\User $socialiteUser
    ): User
    {
        $providerUserId = (string) ($socialiteUser->getId() ?? '');
        $email = $socialiteUser->getEmail();

        if ($providerUserId === '') {
            abort(422, 'Provider user id tidak ditemukan.');
        }

        return DB::transaction(function () use ($provider, $providerUserId, $email, $socialiteUser) {
            $socialAccount = SocialAccount::with('user')
                ->where('provider', $provider)
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($socialAccount) {
                $socialAccount->update([
                    'email' => $email ?: $socialAccount->email,
                    'avatar_url' => $socialiteUser->getAvatar() ?: $socialAccount->avatar_url,
                ]);

                return $socialAccount->user;
            }

            if (! $email) {
                abort(422, 'Email tidak tersedia dari provider. Silakan login ulang atau gunakan akun yang sudah terhubung.');
            }

            $user = User::where('email', $email)->first();

            if (! $user) {
                $user = User::create([
                    'name' => $socialiteUser->getName()
                        ?: $socialiteUser->getNickname()
                        ?: Str::before($email, '@'),
                    'email' => $email,
                    'password' => Hash::make(Str::random(40)),
                    'role' => 'user',
                ]);
            }

            SocialAccount::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_user_id' => $providerUserId,
                'email' => $email,
                'avatar_url' => $socialiteUser->getAvatar(),
            ]);

            return $user;
        });
    }

    private function encodeOauthState(array $state): string
    {
        return rtrim(strtr(base64_encode(json_encode($state, JSON_UNESCAPED_SLASHES)), '+/', '-_'), '=');
    }

    private function decodeOauthState(?string $encodedState): array
    {
        if (! $encodedState) {
            return [];
        }

        $padded = str_pad(strtr($encodedState, '-_', '+/'), strlen($encodedState) % 4 === 0 ? strlen($encodedState) : strlen($encodedState) + 4 - (strlen($encodedState) % 4), '=', STR_PAD_RIGHT);
        $decoded = base64_decode($padded, true);

        if ($decoded === false) {
            return [];
        }

        $payload = json_decode($decoded, true);

        return is_array($payload) ? $payload : [];
    }

    private function extractFrontendRedirect(Request $request): ?string
    {
        $state = $this->decodeOauthState($request->query('state'));
        $redirectTo = $state['redirect_to'] ?? config('services.oauth.frontend_redirect_default');

        if (! is_string($redirectTo) || trim($redirectTo) === '') {
            return null;
        }

        if (! filter_var($redirectTo, FILTER_VALIDATE_URL)) {
            return null;
        }

        return $redirectTo;
    }

    private function buildFrontendRedirect(string $baseUrl, array $params): string
    {
        $fragment = http_build_query($params);
        $trimmed = rtrim($baseUrl, '#');

        return $trimmed . '#' . $fragment;
    }

    private function socialiteProvider(string $provider): Provider
    {
        $driver = Socialite::driver($provider);

        if (! method_exists($driver, 'stateless')) {
            abort(422, "Driver OAuth {$provider} tidak mendukung mode stateless.");
        }

        $statelessDriver = call_user_func([$driver, 'stateless']);

        if (! $statelessDriver instanceof Provider) {
            abort(422, "Driver OAuth {$provider} tidak valid.");
        }

        return $statelessDriver;
    }

    private function applyScopes(Provider $driver, array $scopes): void
    {
        if (! method_exists($driver, 'scopes')) {
            return;
        }

        call_user_func([$driver, 'scopes'], $scopes);
    }

    private function attachOauthState(Provider $driver, array $state): void
    {
        if (! method_exists($driver, 'with')) {
            return;
        }

        call_user_func([$driver, 'with'], [
            'state' => $this->encodeOauthState($state),
        ]);
    }
}
