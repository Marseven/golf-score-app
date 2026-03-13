<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\HoleController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\MarkerController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\PlayerImportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\SocialiteController;
use App\Http\Controllers\TournamentController;
use Illuminate\Support\Facades\Route;

// Landing page
Route::get('/', [LeaderboardController::class, 'home'])->name('home');

// Google OAuth
Route::get('/auth/google/redirect', [SocialiteController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [SocialiteController::class, 'callback'])->name('auth.google.callback');

// Public tournaments list
Route::get('/tournois', [LeaderboardController::class, 'tournamentList'])->name('tournois');

// Public leaderboard
Route::get('/classement/{tournament?}', [LeaderboardController::class, 'index'])->name('classement');
Route::get('/tv/{tournament?}', [LeaderboardController::class, 'tv'])->name('tv');

// Public registration
Route::get('/inscription/{tournament}', [RegistrationController::class, 'create'])->name('inscription.create');
Route::post('/inscription/{tournament}', [RegistrationController::class, 'store'])->name('inscription.store');
Route::get('/inscription/{tournament}/paiement/{player}', [PaymentController::class, 'create'])->name('paiement.create');
Route::post('/inscription/{tournament}/paiement/{player}', [PaymentController::class, 'store'])->name('paiement.store');
Route::post('/paiement/callback', [PaymentController::class, 'callback'])->name('paiement.callback');

// Marker (public login, session-based scoring)
Route::get('/marqueur', [MarkerController::class, 'login'])->name('marqueur.login');
Route::post('/marqueur', [MarkerController::class, 'authenticate'])->name('marqueur.authenticate');
Route::get('/marqueur/s/{token}', [MarkerController::class, 'scoringByToken'])->name('marqueur.token');
Route::get('/marqueur/scoring/{group}', [MarkerController::class, 'scoring'])->name('marqueur.scoring')->middleware('marker');
Route::post('/marqueur/scoring/{group}/save', [MarkerController::class, 'saveScores'])->name('marqueur.save')->middleware('marker');
Route::post('/marqueur/logout', [MarkerController::class, 'logout'])->name('marqueur.logout');

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin dashboard
    Route::get('/admin', [AdminController::class, 'dashboard'])->name('admin.dashboard')->middleware('role:admin,captain');

    // Tournament CRUD
    Route::resource('tournaments', TournamentController::class)->middleware('role:admin,captain');

    // Nested tournament resources
    Route::prefix('tournaments/{tournament}')->middleware('role:admin,captain')->group(function () {
        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::resource('players', PlayerController::class)->except(['show']);
        Route::post('players/import', [PlayerImportController::class, 'import'])->name('players.import');
        Route::resource('groups', GroupController::class)->except(['show']);
        Route::get('holes', [HoleController::class, 'edit'])->name('holes.edit');
        Route::put('holes', [HoleController::class, 'update'])->name('holes.update');
        Route::post('holes/init', [HoleController::class, 'init'])->name('holes.init');
        Route::get('export/pdf', [ExportController::class, 'pdf'])->name('export.pdf');
        Route::get('export/excel', [ExportController::class, 'excel'])->name('export.excel');
    });

    // Admin-only: registrations management
    Route::prefix('tournaments/{tournament}')->middleware('role:admin')->group(function () {
        Route::get('registrations', [RegistrationController::class, 'index'])->name('registrations.index');
        Route::patch('registrations/{player}', [RegistrationController::class, 'update'])->name('registrations.update');
    });
});

require __DIR__.'/auth.php';
