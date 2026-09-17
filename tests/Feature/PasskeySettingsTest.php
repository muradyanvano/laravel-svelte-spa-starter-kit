<?php

use App\Models\User;
use Database\Factories\PasskeyFactory;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::passkeys());
});

test('guests cannot access the passkey settings endpoint', function () {
    $this->getJson('/api/v1/settings/passkeys')->assertUnauthorized();
});

test('authenticated users receive an empty passkey list when none are registered', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk()
        ->assertJsonPath('data', []);
});

test('authenticated users can list their passkeys with safe metadata only', function () {
    $user = User::factory()->create();

    $older = PasskeyFactory::new()->for($user)->create([
        'name' => 'Older Device',
        'created_at' => now()->subDay(),
    ]);

    $newer = PasskeyFactory::new()->for($user)->create([
        'name' => 'Newer Device',
        'created_at' => now(),
        'last_used_at' => now()->subHour(),
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.0.name', 'Newer Device')
        ->assertJsonPath('data.0.authenticator', 'Windows Hello')
        ->assertJsonPath('data.1.id', $older->id);

    expect($response->json('data.0.created_at_diff'))->toBeString()->not->toBeEmpty();
    expect($response->json('data.0.last_used_at_diff'))->toBeString()->not->toBeEmpty();
});

test('passkey list responses never expose credential material', function () {
    $user = User::factory()->create();

    PasskeyFactory::new()->for($user)->create();

    $response = $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk();

    $encoded = json_encode($response->json(), JSON_THROW_ON_ERROR);

    expect($encoded)->not->toContain('credential_id');
    expect($encoded)->not->toContain('aaguid');
    expect($encoded)->not->toContain('publicKey');

    $response->assertJsonMissingPath('data.0.credential');
    $response->assertJsonMissingPath('data.0.credential_id');
});

test('users cannot see passkeys belonging to other accounts', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    PasskeyFactory::new()->for($owner)->create(['name' => 'Owner Device']);
    PasskeyFactory::new()->for($other)->create(['name' => 'Other Device']);

    $this->actingAs($other)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Other Device');
});

test('passkey list ordering is deterministic newest first', function () {
    $user = User::factory()->create();

    $first = PasskeyFactory::new()->for($user)->create(['name' => 'First']);
    $first->forceFill(['created_at' => now()->subDays(2)])->save();

    $second = PasskeyFactory::new()->for($user)->create(['name' => 'Second']);
    $second->forceFill(['created_at' => now()->subDay()])->save();

    $third = PasskeyFactory::new()->for($user)->create(['name' => 'Third']);
    $third->forceFill(['created_at' => now()])->save();

    $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk()
        ->assertJsonPath('data.0.id', $third->id)
        ->assertJsonPath('data.1.id', $second->id)
        ->assertJsonPath('data.2.id', $first->id);
});
