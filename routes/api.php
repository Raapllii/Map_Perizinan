<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicMapAccessLogController;
use App\Http\Controllers\Api\PublicMapFeedbackController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public API Routes (Map Data & Filter References)
Route::post('/public-map-access', [PublicMapAccessLogController::class, 'store']);
Route::post('/public-map-feedback', [PublicMapFeedbackController::class, 'store']);
Route::get('/businesses/search', [BusinessController::class, 'search']);
Route::get('/businesses', [BusinessController::class, 'index']);
Route::get('/businesses/{business}', [BusinessController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/locations/kecamatan', [App\Http\Controllers\Api\LocationController::class, 'getKecamatan']);
Route::get('/locations/kelurahan', [App\Http\Controllers\Api\LocationController::class, 'getKelurahan']);


