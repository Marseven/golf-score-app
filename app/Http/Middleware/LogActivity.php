<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    // Routes to skip (polling, assets, etc.)
    private array $skipRoutes = [
        'api/score-count',
        'sanctum/csrf-cookie',
        'build/',
        'favicon.ico',
    ];

    // Map route names to human-readable actions
    private array $actionMap = [
        // Auth
        'login' => ['login', 'Connexion'],
        'logout' => ['logout', 'Déconnexion'],
        'register' => ['register', 'Inscription'],

        // Marker
        'marqueur.authenticate' => ['login', 'Connexion marqueur'],
        'marqueur.scoring' => ['scoring', 'Saisie des scores (marqueur)'],
        'marqueur.save' => ['scoring', 'Enregistrement des scores (marqueur)'],
        'marqueur.confirm' => ['scoring', 'Confirmation des scores (marqueur)'],
        'marqueur.groups' => ['view', 'Consultation des groupes (marqueur)'],
        'marqueur.logout' => ['logout', 'Déconnexion marqueur'],

        // Caddie Master
        'caddie-master.authenticate' => ['login', 'Connexion caddie master'],
        'caddie-master.dashboard' => ['view', 'Dashboard caddie master'],
        'caddie-master.scoring' => ['scoring', 'Saisie des scores (caddie master)'],
        'caddie-master.save' => ['scoring', 'Enregistrement des scores (caddie master)'],
        'caddie-master.confirm' => ['scoring', 'Confirmation des scores (caddie master)'],
        'caddie-master.logout' => ['logout', 'Déconnexion caddie master'],

        // Admin
        'admin.dashboard' => ['view', 'Dashboard admin'],
        'tournaments.show' => ['view', 'Gestion du tournoi'],
        'tournaments.store' => ['create', 'Création de tournoi'],
        'tournaments.update' => ['update', 'Modification du tournoi'],
        'tournaments.destroy' => ['delete', 'Suppression du tournoi'],
        'tournaments.prepareNextPhase' => ['update', 'Préparation phase suivante'],
        'tournaments.applyPhaseCut' => ['update', 'Application du cut'],
        'tournaments.resetPhaseCut' => ['update', 'Réinitialisation du cut'],

        // Scores
        'scores.update' => ['scoring', 'Modification des scores (admin)'],
        'scores.reset' => ['delete', 'Suppression des scores'],

        // Players
        'players.store' => ['create', 'Ajout de joueur'],
        'players.update' => ['update', 'Modification de joueur'],
        'players.destroy' => ['delete', 'Suppression de joueur'],
        'players.import' => ['create', 'Import de joueurs'],

        // Groups
        'groups.store' => ['create', 'Création de groupe'],
        'groups.update' => ['update', 'Modification de groupe'],
        'groups.destroy' => ['delete', 'Suppression de groupe'],

        // Penalties
        'penalties.store' => ['create', 'Ajout de pénalité'],
        'penalties.destroy' => ['delete', 'Suppression de pénalité'],

        // Public
        'classement' => ['view', 'Consultation du classement'],
        'tv' => ['view', 'Écran TV'],
        'tournois' => ['view', 'Liste des tournois'],
        'home' => ['view', 'Page d\'accueil'],

        // Export
        'export.pdf' => ['export', 'Export PDF'],
        'export.excel' => ['export', 'Export Excel'],

        // Registration
        'inscription.store' => ['create', 'Inscription joueur'],

        // Settings
        'admin.settings.update' => ['update', 'Modification paramètres'],
        'admin.users.store' => ['create', 'Création utilisateur'],
        'admin.users.update' => ['update', 'Modification utilisateur'],
        'admin.users.destroy' => ['delete', 'Suppression utilisateur'],
        'admin.users.regeneratePin' => ['update', 'Régénération PIN marqueur'],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Skip non-relevant requests
        if ($this->shouldSkip($request)) {
            return $response;
        }

        try {
            $routeName = $request->route()?->getName();
            $mapped = $this->actionMap[$routeName] ?? null;

            if ($mapped) {
                [$type, $action] = $mapped;
            } else {
                // Auto-detect type from method
                $type = match ($request->method()) {
                    'POST' => 'create',
                    'PUT', 'PATCH' => 'update',
                    'DELETE' => 'delete',
                    default => 'view',
                };
                $action = $routeName ?? $request->path();
            }

            // Skip Inertia partial reloads (polling)
            if ($request->header('X-Inertia') && $request->method() === 'GET' && $type === 'view') {
                // Only log full page views, not polling reloads
                if ($request->header('X-Inertia-Partial-Data')) {
                    return $response;
                }
            }

            ActivityLog::log($type, $action, $request);
        } catch (\Throwable $e) {
            // Never block the request due to logging failure
        }

        return $response;
    }

    private function shouldSkip(Request $request): bool
    {
        $path = $request->path();
        foreach ($this->skipRoutes as $skip) {
            if (str_starts_with($path, $skip)) {
                return true;
            }
        }
        return false;
    }
}
