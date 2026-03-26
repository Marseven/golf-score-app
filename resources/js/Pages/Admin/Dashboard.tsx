import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Trash2, Users, Calendar, MapPin, Trophy, CreditCard, UserCheck, Layers, ArrowRight, Clock, Globe, EyeOff, BarChart3 } from 'lucide-react';
import type { Tournament } from '@/types';

interface Stats {
    active_tournaments: number;
    total_players: number;
    total_groups: number;
    total_revenue: number;
    scores_today: number;
    default_currency: string;
    pending_registrations?: number;
    pending_payments?: number;
}

interface Props {
    tournaments: Tournament[];
    stats: Stats;
    isAdmin: boolean;
}

const statusConfig: Record<string, { badge: string; dot: string; label: string }> = {
    draft: { badge: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/20', dot: 'bg-amber-400', label: 'Brouillon' },
    published: { badge: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 ring-1 ring-cyan-500/20', dot: 'bg-cyan-400', label: 'Publié' },
    active: { badge: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20', dot: 'bg-emerald-400 animate-pulse', label: 'En cours' },
    finished: { badge: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20', dot: 'bg-blue-400', label: 'Terminé' },
};

type FilterStatus = 'all' | 'draft' | 'published' | 'active' | 'finished';

export default function AdminDashboard({ tournaments, stats, isAdmin }: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [filter, setFilter] = useState<FilterStatus>('all');

    const filtered = filter === 'all' ? tournaments : tournaments.filter((t) => t.status === filter);

    const handleDelete = (e: React.MouseEvent, tournament: Tournament) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Supprimer le tournoi "${tournament.name}" ? Cette action est irréversible.`)) return;
        router.delete(route('tournaments.destroy', tournament.id));
    };

    const handleTogglePublish = (e: React.MouseEvent, tournament: Tournament) => {
        e.preventDefault();
        e.stopPropagation();
        const isPublished = tournament.status === 'published' || tournament.status === 'active';
        const action = isPublished ? 'Dépublier' : 'Publier';
        if (!confirm(`${action} le tournoi "${tournament.name}" ?`)) return;
        router.patch(route('tournaments.togglePublish', tournament.id));
    };

    const filters: { id: FilterStatus; label: string; count: number }[] = [
        { id: 'all', label: 'Tous', count: tournaments.length },
        { id: 'published', label: 'Publié', count: tournaments.filter(t => t.status === 'published').length },
        { id: 'active', label: 'En cours', count: tournaments.filter(t => t.status === 'active').length },
        { id: 'draft', label: 'Brouillon', count: tournaments.filter(t => t.status === 'draft').length },
        { id: 'finished', label: 'Terminé', count: tournaments.filter(t => t.status === 'finished').length },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard" />

            {/* Welcome header */}
            <div className="mb-8">
                <h1 className="font-display text-2xl sm:text-3xl text-foreground mb-1">
                    Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Voici un aperçu de vos tournois et de votre activité.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                <div className="glass-card group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Trophy className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{stats.active_tournaments}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tournois actifs</p>
                </div>

                <div className="glass-card group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{stats.total_players}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Joueurs inscrits</p>
                </div>

                <div className="glass-card group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                            <CreditCard className="w-4.5 h-4.5 text-cyan-500 dark:text-cyan-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{Number(stats.total_revenue).toLocaleString('fr-FR')} {stats.default_currency}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Recettes totales</p>
                </div>

                {isAdmin && stats.pending_registrations !== undefined ? (
                    <div className="glass-card group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <UserCheck className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                            </div>
                            {stats.pending_registrations > 0 && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            )}
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{stats.pending_registrations}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Inscriptions en attente</p>
                    </div>
                ) : (
                    <div className="glass-card group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight">{tournaments.length}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Total tournois</p>
                    </div>
                )}

                <div className="glass-card group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <BarChart3 className="w-4.5 h-4.5 text-orange-500 dark:text-orange-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{stats.scores_today}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Scores aujourd'hui</p>
                </div>

                <div className="glass-card group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Layers className="w-4.5 h-4.5 text-violet-500 dark:text-violet-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{stats.total_groups}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Groupes</p>
                </div>
            </div>

            {isAdmin && stats.pending_payments !== undefined && stats.pending_payments > 0 && (
                <div className="glass-card flex items-center gap-3 mb-8 border-amber-500/20">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{stats.pending_payments} paiement{stats.pending_payments > 1 ? 's' : ''} en attente</p>
                        <p className="text-xs text-muted-foreground">Des paiements nécessitent votre attention.</p>
                    </div>
                </div>
            )}

            {/* Tournaments section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <h2 className="font-display text-xl text-foreground">Mes tournois</h2>
                <Link
                    href={route('tournaments.create')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Créer un tournoi
                </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                            filter === f.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                        }`}
                    >
                        {f.label}
                        <span className={`text-xs tabular-nums ${filter === f.id ? 'text-primary/60' : 'text-muted-foreground/50'}`}>
                            {f.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tournament list */}
            {filtered.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">Aucun tournoi</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                        {filter === 'all'
                            ? 'Créez votre premier tournoi pour commencer à gérer vos compétitions.'
                            : 'Aucun tournoi avec ce statut.'}
                    </p>
                    {filter === 'all' && (
                        <Link
                            href={route('tournaments.create')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Créer un tournoi
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((tournament) => {
                        const config = statusConfig[tournament.status] ?? statusConfig.draft;
                        return (
                            <Link
                                key={tournament.id}
                                href={route('tournaments.show', tournament.id)}
                                className="glass-card group hover:border-border transition-all duration-300 hover:scale-[1.01]"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                        {config.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {tournament.status !== 'finished' && (
                                            <button
                                                onClick={(e) => handleTogglePublish(e, tournament)}
                                                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                                    tournament.status === 'published' || tournament.status === 'active'
                                                        ? 'hover:bg-surface-hover text-muted-foreground hover:text-amber-400'
                                                        : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400'
                                                }`}
                                                title={tournament.status === 'published' || tournament.status === 'active' ? 'Dépublier' : 'Publier'}
                                            >
                                                {tournament.status === 'published' || tournament.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(e, tournament)}
                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-all"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                                    {tournament.name}
                                </h3>

                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{tournament.club}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                                        <span>
                                            {new Date(tournament.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {tournament.end_date && tournament.end_date !== tournament.start_date && (
                                                <> – {new Date(tournament.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                            <span className="text-sm font-medium text-foreground">{tournament.players_count ?? 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                                            <span className="text-sm font-medium text-foreground">{tournament.groups_count ?? 0}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}
