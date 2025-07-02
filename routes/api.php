<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Broadcast;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// ✅ Add JWT-protected route to check user
Route::middleware('auth:api')->get('/me', function (Request $request) {
    return response()->json($request->user());
});

// ✅ Chat routes
Route::middleware('auth:api')->group(function () {
    Route::get('messages', [ChatController::class, 'index']);
    Route::post('messages', [ChatController::class, 'store']);
});

// ✅ Broadcast auth route for Echo + JWT
Broadcast::routes(['middleware' => ['api', 'ws.jwt']]);

