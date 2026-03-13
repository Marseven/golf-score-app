import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Trophy, MapPin, Calendar, Users, Target } from 'lucide-react';
import type { Tournament } from '@/types';

interface Props {
    tournaments: Tournament[];
}

export default function Tournaments({ tournaments }: Props) {
    return (
        <PublicLayout>
            <Head title="Tournois" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Tournois en cours</h1>
                        <p className="text-sm text-muted-foreground">{tournaments.length} tournoi{tournaments.length !== 1 ? 's' : ''} actif{tournaments.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {tournaments.length === 0 ? (
                    <div className="glass-card text-center py-16">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">Aucun tournoi actif</h2>
                        <p className="text-sm text-muted-foreground">Il n'y a pas de tournoi en cours pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {tournaments.map((tournament) => (
                            <div key={tournament.id} className="glass-card">
                                <div className="mb-4">
                                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400">
                                        En cours
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1">{tournament.name}</h3>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{tournament.club}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{new Date(tournament.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
                                        Voir classement
                                    </Link>
                                    {tournament.registration_open && (
                                        <Link
                                            href={route('inscription.create', tournament.id)}
                                            className="flex-1 text-center px-4 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors"
                                        >
                                            S'inscrire
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
