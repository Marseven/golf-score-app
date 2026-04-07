import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Trophy, MapPin, Calendar, Users, Target, UserPlus, Search, CheckCircle2, FileText, FileSpreadsheet } from 'lucide-react';
import type { Tournament } from '@/types';

interface Props {
    tournaments: Tournament[];
}

type StatusFilter = 'all' | 'upcoming' | 'active' | 'finished' | 'open';

function getTournamentState(tournament: Tournament): 'upcoming' | 'active' | 'finished' {
    if (tournament.status === 'finished') return 'finished';
    if (tournament.status === 'active') return 'active';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(tournament.start_date);
    if (start > startOfToday) return 'upcoming';
    return 'active';
}

export default function Tournaments({ tournaments }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filtered = useMemo(() => {
        return tournaments.filter((t) => {
            const matchesSearch = !search ||
                t.name.toLowerCase().includes(search.toLowerCase()) ||
                t.club?.toLowerCase().includes(search.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === 'upcoming') matchesStatus = getTournamentState(t) === 'upcoming';
            else if (statusFilter === 'active') matchesStatus = getTournamentState(t) === 'active';
            else if (statusFilter === 'finished') matchesStatus = getTournamentState(t) === 'finished';
            else if (statusFilter === 'open') matchesStatus = !!t.registration_open;

            return matchesSearch && matchesStatus;
        });
    }, [tournaments, search, statusFilter]);

    const filters: { value: StatusFilter; label: string }[] = [
        { value: 'all', label: `Tous (${tournaments.length})` },
        { value: 'upcoming', label: 'A venir' },
        { value: 'active', label: 'En cours' },
        { value: 'finished', label: 'Terminés' },
        { value: 'open', label: 'Inscriptions ouvertes' },
    ];

    return (
        <PublicLayout>
            <Head title="Tournois" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Tournois</h1>
                        <p className="text-sm text-muted-foreground">{filtered.length} tournoi{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un tournoi..."
                            className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {filters.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="glass-card text-center py-16">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">Aucun tournoi trouve</h2>
                        <p className="text-sm text-muted-foreground">
                            {search || statusFilter !== 'all' ? 'Essayez de modifier vos filtres.' : "Il n'y a pas de tournoi pour le moment."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((tournament) => {
                            const state = getTournamentState(tournament);
                            return (
                                <div key={tournament.id} className="glass-card">
                                    <div className="mb-4">
                                        {state === 'finished' ? (
                                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 inline-flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />Terminé
                                            </span>
                                        ) : state === 'upcoming' ? (
                                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400">
                                                A venir
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400">
                                                En cours
                                            </span>
                                        )}
                                        {tournament.registration_open && state !== 'finished' && (
                                            <span className="ml-2 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400">
                                                Inscriptions ouvertes
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">{tournament.name}</h3>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{tournament.club}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>
                                            {new Date(tournament.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {tournament.end_date && tournament.end_date !== tournament.start_date && (
                                                <> – {new Date(tournament.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-sm font-medium text-foreground">{tournament.players_count ?? 0}</span>
                                            <span className="text-xs text-muted-foreground">joueurs</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Target className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-sm font-medium text-foreground">{tournament.groups_count ?? 0}</span>
                                            <span className="text-xs text-muted-foreground">groupes</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <Link
                                            href={route('classement', tournament.id)}
                                            className="flex-1 text-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            {state === 'finished' ? 'Résultats' : 'Voir classement'}
                                        </Link>
                                        {state === 'finished' ? (
                                            <>
                                                <a
                                                    href={route('export.pdf', tournament.id)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </a>
                                                <a
                                                    href={route('export.excel', tournament.id)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                </a>
                                            </>
                                        ) : tournament.registration_open && (
                                            <Link
                                                href={route('inscription.create', tournament.id)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 text-amber-950 rounded-xl text-sm font-medium hover:bg-amber-400 transition-colors"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                S'inscrire
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
