<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\DatabaseController;

// Public React App Route (WebGIS)
Route::get('/', function () {
    return view('app');
});

// Fallback for any other public route (except api and admin)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|admin).*$');

// Admin Login Route (Frontend)
Route::get('/admin/login', function () {
    return view('app');
})->name('login');

// Protected Admin SPA Routes
Route::middleware('auth')->group(function () {
    Route::get('/admin/{any}', function () {
        return view('app');
    })->where('any', '.*');
});

// Protected Admin API Routes (Stateful)
Route::prefix('api/admin')->group(function () {
    Route::middleware('throttle:5,1')->post('/login', [AuthController::class, 'login']);
    
    Route::middleware('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/export/excel', [DashboardController::class, 'exportExcel']);
        
        Route::post('/businesses', [BusinessController::class, 'store']);
        Route::get('/businesses/{business}', [BusinessController::class, 'show']);
        Route::put('/businesses/{business}', [BusinessController::class, 'update']);
        Route::delete('/businesses/{business}', [BusinessController::class, 'destroy']);
        
        Route::put('/businesses/{business}/verify', [VerificationController::class, 'verify']);
        
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::put('/users/{id}/status', [UserController::class, 'updateStatus']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::get('/activity-logs', [UserController::class, 'getActivityLogs']);
        
        Route::get('/user', function (\Illuminate\Http\Request $request) {
            return response()->json(['user' => $request->user()]);
        });
        
        // Profile & Account Routes
        Route::put('/user/profile', [UserController::class, 'updateProfile']);
        Route::post('/user/avatar', [UserController::class, 'uploadAvatar']);
        
        // Settings Routes
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);
        
        // Database & Backup Routes
        Route::get('/database/status', [DatabaseController::class, 'status']);
        Route::post('/database/backup', [DatabaseController::class, 'backup']);
        Route::post('/database/restore', [DatabaseController::class, 'restore']);
        Route::delete('/database/backup', [DatabaseController::class, 'deleteBackup']);
        Route::get('/database/backup/{filename}', [DatabaseController::class, 'downloadBackup']);
        Route::get('/database/export', [DatabaseController::class, 'export']);
        Route::post('/database/import', [DatabaseController::class, 'import']);
    });
});
