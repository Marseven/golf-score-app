<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CaddyMasterController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\HoleController;
use App\Http\Controllers\HoleImportController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\MarkerController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\PlayerImportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SocialiteController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\UserController;
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
Route::get('/api/score-count/{tournament}', function (App\Models\Tournament $tournament) {
    return response()->json(['count' => $tournament->scores()->count()]);
});

// Public registration
Route::get('/inscription/{tournament}', [RegistrationController::class, 'create'])->name('inscription.create');
Route::post('/inscription/{tournament}', [RegistrationController::class, 'store'])->name('inscription.store');
Route::get('/inscription/{tournament}/paiement/{player}', [PaymentController::class, 'create'])->name('paiement.create');
Route::post('/inscription/{tournament}/paiement/{player}', [PaymentController::class, 'store'])->name('paiement.store');
Route::post('/paiement/callback', [PaymentController::class, 'callback'])->name('paiement.callback');
Route::get('/paiement/{payment}/status', [PaymentController::class, 'status'])->name('paiement.status');

// Marker (public login, session-based scoring)
Route::get('/marqueur', [MarkerController::class, 'login'])->name('marqueur.login');
Route::post('/marqueur', [MarkerController::class, 'authenticate'])->name('marqueur.authenticate');
Route::get('/marqueur/s/{token}', [MarkerController::class, 'scoringByToken'])->name('marqueur.token');
Route::get('/marqueur/groupes', [MarkerController::class, 'groups'])->name('marqueur.groups');
Route::get('/marqueur/scoring/{group}', [MarkerController::class, 'scoring'])->name('marqueur.scoring')->middleware('marker');
Route::post('/marqueur/scoring/{group}/save', [MarkerController::class, 'saveScores'])->name('marqueur.save')->middleware('marker');
Route::post('/marqueur/scoring/{group}/confirm', [MarkerController::class, 'confirmScores'])->name('marqueur.confirm')->middleware('marker');
Route::post('/marqueur/logout', [MarkerController::class, 'logout'])->name('marqueur.logout');

// Caddie-Master (public login, session-based multi-group scoring)
Route::get('/caddie-master', [CaddyMasterController::class, 'login'])->name('caddie-master.login');
Route::post('/caddie-master', [CaddyMasterController::class, 'authenticate'])->name('caddie-master.authenticate');
Route::middleware('caddie-master')->prefix('caddie-master')->group(function () {
    Route::get('/dashboard', [CaddyMasterController::class, 'dashboard'])->name('caddie-master.dashboard');
    Route::get('/scoring/{group}', [CaddyMasterController::class, 'scoring'])->name('caddie-master.scoring');
    Route::post('/scoring/{group}/save', [CaddyMasterController::class, 'saveScores'])->name('caddie-master.save');
    Route::post('/manual-scores', [CaddyMasterController::class, 'saveManualScores'])->name('caddie-master.manualScores');
    Route::post('/scoring/{group}/confirm', [CaddyMasterController::class, 'confirmScores'])->name('caddie-master.confirm');
});
Route::post('/caddie-master/logout', [CaddyMasterController::class, 'logout'])->name('caddie-master.logout');

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin dashboard
    Route::get('/admin', [AdminController::class, 'dashboard'])->name('admin.dashboard')->middleware('role:admin,captain');

    // Tournament CRUD
    Route::resource('tournaments', TournamentController::class)->middleware('role:admin,captain');

    // Quick publish/unpublish toggle
    Route::patch('tournaments/{tournament}/toggle-publish', [TournamentController::class, 'togglePublish'])
        ->name('tournaments.togglePublish')
        ->middleware('role:admin,captain');

    // Phase cut system
    Route::post('tournaments/{tournament}/phase-cut', [TournamentController::class, 'applyPhaseCut'])
        ->name('tournaments.applyPhaseCut')
        ->middleware('role:admin,captain');
    Route::post('tournaments/{tournament}/phase-cut/reset', [TournamentController::class, 'resetPhaseCut'])
        ->name('tournaments.resetPhaseCut')
        ->middleware('role:admin,captain');

    // Available players for group creation
    Route::get('tournaments/{tournament}/available-players', [GroupController::class, 'availablePlayers'])
        ->name('tournaments.availablePlayers')
        ->middleware('role:admin,captain');

    // Nested tournament resources
    Route::prefix('tournaments/{tournament}')->middleware('role:admin,captain')->group(function () {
        Route::resource('courses', CourseController::class)->only(['store', 'update', 'destroy']);
        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::resource('players', PlayerController::class)->except(['show']);
        Route::post('players/import', [PlayerImportController::class, 'import'])->name('players.import');
        Route::resource('groups', GroupController::class)->except(['show']);
        Route::post('markers', [GroupController::class, 'storeMarker'])->name('markers.store');
        Route::get('holes', [HoleController::class, 'edit'])->name('holes.edit');
        Route::put('holes', [HoleController::class, 'update'])->name('holes.update');
        Route::post('holes/init', [HoleController::class, 'init'])->name('holes.init');
        Route::post('holes/import', [HoleImportController::class, 'import'])->name('holes.import');
        Route::put('category-pars', [HoleController::class, 'updateCategoryPars'])->name('holes.updateCategoryPars');
        Route::get('export/pdf', [ExportController::class, 'pdf'])->name('export.pdf');
        Route::get('export/excel', [ExportController::class, 'excel'])->name('export.excel');
        Route::put('scores', [TournamentController::class, 'updateScores'])->name('scores.update');
        Route::delete('scores', [TournamentController::class, 'resetScores'])->name('scores.reset');
        Route::post('penalties', [TournamentController::class, 'storePenalty'])->name('penalties.store');
        Route::post('groups/{group}/regenerate-pin', [GroupController::class, 'regeneratePin'])->name('groups.regeneratePin');
        Route::post('prepare-next-phase', [TournamentController::class, 'prepareNextPhase'])->name('tournaments.prepareNextPhase');
        Route::post('empty-phase-groups', [TournamentController::class, 'emptyPhaseGroups'])->name('tournaments.emptyPhaseGroups');
        Route::delete('delete-phase-groups', [TournamentController::class, 'deletePhaseGroups'])->name('tournaments.deletePhaseGroups');
        Route::delete('penalties/{penalty}', [TournamentController::class, 'destroyPenalty'])->name('penalties.destroy');
    });

    // Admin-only: registrations management
    Route::prefix('tournaments/{tournament}')->middleware('role:admin')->group(function () {
        Route::get('registrations', [RegistrationController::class, 'index'])->name('registrations.index');
        Route::patch('registrations/{player}', [RegistrationController::class, 'update'])->name('registrations.update');
        Route::patch('registrations-bulk', [RegistrationController::class, 'bulkUpdate'])->name('registrations.bulkUpdate');
        Route::patch('payments/{payment}/complete', [PaymentController::class, 'markCompleted'])->name('payments.complete');
        Route::get('payments/{payment}/receipt', [PaymentController::class, 'receipt'])->name('payments.receipt');
    });

    // Admin-only: members, settings & user management
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/members', [MemberController::class, 'index'])->name('admin.members');
        Route::post('/admin/members', [MemberController::class, 'store'])->name('admin.members.store');
        Route::put('/admin/members/{member}', [MemberController::class, 'update'])->name('admin.members.update');
        Route::delete('/admin/members/{member}', [MemberController::class, 'destroy'])->name('admin.members.destroy');
        Route::post('/admin/members/import', [MemberController::class, 'import'])->name('admin.members.import');

        Route::get('/admin/settings', [SettingController::class, 'index'])->name('admin.settings');
        Route::put('/admin/settings', [SettingController::class, 'update'])->name('admin.settings.update');
        Route::post('/admin/settings/logo', [SettingController::class, 'uploadLogo'])->name('admin.settings.upload-logo');
        Route::post('/admin/settings/sponsor-logo', [SettingController::class, 'uploadSponsorLogo'])->name('admin.settings.upload-sponsor-logo');

        Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users');
        Route::post('/admin/users', [UserController::class, 'store'])->name('admin.users.store');
        Route::put('/admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::delete('/admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('/admin/users/{user}/regenerate-pin', [UserController::class, 'regeneratePin'])->name('admin.users.regeneratePin');

        Route::get('/admin/logs', function () {
            $logs = \App\Models\ActivityLog::orderBy('created_at', 'desc')->limit(500)->get();
            return \Inertia\Inertia::render('Admin/Logs', ['logs' => $logs]);
        })->name('admin.logs');
    });
});

require __DIR__.'/auth.php';
