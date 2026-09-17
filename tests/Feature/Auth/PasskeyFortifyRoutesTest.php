<?php

use App\Models\User;
use Database\Factories\PasskeyFactory;
use Laravel\Fortify\Features;
use Laravel\Passkeys\Http\Controllers\PasskeyLoginController;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::passkeys());
});

test('passkey feature registers the expected fortify routes', function () {
    $routes = collect(app('router')->getRoutes())
        ->map(fn ($route) => $route->methods()[0].' '.$route->uri())
        ->filter(fn (string $route) => str_contains($route, 'passkey') || str_contains($route, 'passkeys'));

    expect($routes)->toContain('GET passkeys/login/options');
    expect($routes)->toContain('POST passkeys/login');
    expect($routes)->toContain('GET passkeys/confirm/options');
    expect($routes)->toContain('POST passkeys/confirm');
    expect($routes)->toContain('GET user/passkeys/options');
    expect($routes)->toContain('POST user/passkeys');
    expect($routes)->toContain('DELETE user/passkeys/{passkey}');
});

test('guests can request passkey login options', function () {
    $this->getJson('/passkeys/login/options')
        ->assertOk()
        ->assertJsonStructure(['options']);
});

test('passkey confirm options require authentication', function () {
    $this->getJson('/passkeys/confirm/options')->assertUnauthorized();
});

test('authenticated users can request passkey confirm options', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/passkeys/confirm/options')
        ->assertOk()
        ->assertJsonStructure(['options']);
});

test('passkey registration options require authentication', function () {
    $this->getJson('/user/passkeys/options')->assertUnauthorized();
});

test('passkey registration options require recent password confirmation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/user/passkeys/options')
        ->assertStatus(423);
});

test('passkey registration options are available after password confirmation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->getJson('/user/passkeys/options')
        ->assertOk()
        ->assertJsonStructure(['options']);
});

test('passkey deletion requires authentication', function () {
    $passkey = PasskeyFactory::new()->create();

    $this->deleteJson('/user/passkeys/'.$passkey->id)->assertUnauthorized();
});

test('passkey deletion requires recent password confirmation', function () {
    $user = User::factory()->create();
    $passkey = PasskeyFactory::new()->for($user)->create();

    $this->actingAs($user)
        ->deleteJson('/user/passkeys/'.$passkey->id)
        ->assertStatus(423);
});

test('users cannot delete passkeys belonging to other accounts', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $passkey = PasskeyFactory::new()->for($owner)->create();

    $this->actingAs($other)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->deleteJson('/user/passkeys/'.$passkey->id)
        ->assertForbidden();
});

test('users can delete their own passkeys when password is confirmed', function () {
    $user = User::factory()->create();
    $passkey = PasskeyFactory::new()->for($user)->create();

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->deleteJson('/user/passkeys/'.$passkey->id)
        ->assertOk()
        ->assertJson(['status' => 'passkey-deleted']);

    expect($passkey->fresh())->toBeNull();
});

test('passkey login authenticates directly without invoking the two factor challenge route', function () {
    $user = User::factory()->withTwoFactor()->create();

    PasskeyFactory::new()->for($user)->create();

    expect($user->hasEnabledTwoFactorAuthentication())->toBeTrue();

    $loginController = app(PasskeyLoginController::class);

    expect($loginController)->toBeInstanceOf(PasskeyLoginController::class);
    expect(
        (new ReflectionClass($loginController))->getMethod('store')->getFileName()
    )->toContain('PasskeyLoginController.php');

    $source = file_get_contents(
        (new ReflectionClass($loginController))->getFileName()
    );

    expect($source)->toContain('$guard->login($passkey->user');
    expect($source)->not->toContain('RedirectIfTwoFactorAuthenticatable');
    expect($source)->not->toContain('two-factor');
});
