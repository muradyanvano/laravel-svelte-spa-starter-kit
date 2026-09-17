<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Laravel\Passkeys\Passkey;

/**
 * @extends Factory<Passkey>
 */
class PasskeyFactory extends Factory
{
    /**
     * @var class-string<Passkey>
     */
    protected $model = Passkey::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(2, true),
            'credential_id' => rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '='),
            'credential' => [
                'aaguid' => '08987058-cadc-4b81-b6e1-30de50dcbe96',
            ],
        ];
    }
}
