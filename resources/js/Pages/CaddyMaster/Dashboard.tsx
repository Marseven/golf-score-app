import { Head, Link, router } from '@inertiajs/react';
import { Shield, LogOut, Users, Target, CheckCircle2, Clock } from 'lucide-react';
import type { Tournament, Group, Hole, Player } from '@/types';

interface DashboardGroup extends Group {
    scoring_progress: number;
    players?: Player[];
}

interface Props {
    tournament: Tournament;
    groups: DashboardGroup[];
    holes: Hole[];
}

export default function CaddyMasterDashboard({ tournament, groups, holes }: Props) {
    const completedGroups = groups.filter((g) => g.scores_confirmed_at);
    const totalProgress = groups.length > 0
        ? Math.round(groups.reduce((sum, g) => sum + g.scoring_progress, 0) / groups.length)
        : 0;

    const stats = [
        { label: 'Groupes', value: String(groups.length), icon: Target, color: 'bg-blue-500/20 text-blue-400' },
        { label: 'Complétés', value: String(completedGroups.length), icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400' },
        { label: 'Progression', value: `${totalProgress}%`, icon: Clock, color: 'bg-amber-500/20 text-amber-400' },
    ];

    return (
        <>
            <Head title="Caddie Master - Tableau de bord" />
            <div className="min-h-screen bg-background">
                {/* Top bar */}
                <div className="sticky top-0 z-40 bg-card border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{tournament.name}</p>
                            <p className="text-xs text-muted-foreground">Caddie Master</p>
                        </div>
                    </div>
                    <Link href={route('caddie-master.logout')} method="post" as="button" className="p-2 rounded-lg hover:bg-white/10">
                        <LogOut className="w-5 h-5 text-muted-foreground" />
                    </Link>
                </div>

                <div className="p-4 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {stats.map((stat) => (
                            <div key={stat.label} className="glass-card flex flex-col items-center py-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-2`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Groups grid */}
                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground mb-3">Groupes</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {groups.map((group) => (
                                <Link
                                    key={group.id}
                                    href={route('caddie-master.scoring', group.id)}
                                    className="glass-card hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{group.code}</span>
                                            {group.tee_time && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {group.tee_time}
                                                </span>
                                            )}
                                        </div>
                                        {group.scores_confirmed_at ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Confirmé
                                            </span>
                                        ) : group.scoring_progress > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                                                En cours
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Player names */}
                                    <div className="space-y-1 mb-3">
                                        {(group.players ?? []).map((player) => (
                                            <div key={player.id} className="flex items-center gap-2">
                                                <Users className="w-3 h-3 text-muted-foreground/50" />
                                                <span className="text-xs text-muted-foreground">{player.name}</span>
                                            </div>
                                        ))}
                                        {(!group.players || group.players.length === 0) && (
                                            <p className="text-xs text-muted-foreground/50">Aucun joueur</p>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-white/5 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${group.scores_confirmed_at ? 'bg-emerald-500' : 'bg-primary'}`}
                                            style={{ width: `${group.scoring_progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 text-right">{group.scoring_progress}%</p>
                                </Link>
                            ))}
                        </div>

                        {groups.length === 0 && (
                            <div className="glass-card text-center py-12">
                                <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">Aucun groupe dans ce tournoi</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
