<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());
});

test('guests cannot access the security settings endpoint', function () {
    $this->getJson('/api/v1/settings/security')->assertUnauthorized();
});

test('authenticated users receive non-sensitive security settings state', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/settings/security')
        ->assertOk()
        ->assertJsonPath('data.can_manage_two_factor', true)
        ->assertJsonPath('data.two_factor_enabled', false)
        ->assertJsonPath('data.requires_confirmation', true)
        ->assertJsonStructure([
            'data' => [
                'can_manage_two_factor',
                'two_factor_enabled',
                'requires_confirmation',
                'password_rules',
            ],
        ])
        ->assertJsonMissingPath('data.two_factor_secret')
        ->assertJsonMissingPath('data.recovery_codes')
        ->assertJsonMissingPath('data.qr_code');
});

test('security settings reports enabled two-factor authentication', function () {
    $user = User::factory()->withTwoFactor()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/settings/security')
        ->assertOk()
        ->assertJsonPath('data.two_factor_enabled', true);
});
