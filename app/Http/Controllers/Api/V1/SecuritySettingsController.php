<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Features;

class SecuritySettingsController extends Controller
{
    /**
     * Return non-sensitive security settings state for the SPA.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $canManageTwoFactor = Features::canManageTwoFactorAuthentication();

        return response()->json([
            'data' => [
                'can_manage_two_factor' => $canManageTwoFactor,
                'can_manage_passkeys' => Features::canManagePasskeys(),
                'two_factor_enabled' => $canManageTwoFactor
                    ? $request->user()->hasEnabledTwoFactorAuthentication()
                    : false,
                'requires_confirmation' => $canManageTwoFactor
                    && Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
                'password_rules' => Password::defaults()->toPasswordRulesString(),
            ],
        ]);
    }
}
