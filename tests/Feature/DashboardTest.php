<?php

use App\Models\User;

test('dashboard spa shell is available without server-side auth gate', function () {
    // Client-side VerifiedRoute owns access; Laravel serves the shell for refreshes.
    $this->get('/dashboard')
        ->assertOk()
        ->assertViewIs('app');
});

test('authenticated users receive the dashboard spa shell', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertViewIs('app');
});
