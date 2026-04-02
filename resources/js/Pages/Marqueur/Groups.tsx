import { Head, Link } from '@inertiajs/react';
import { Target, Users, Clock, MapPin, CheckCircle2, ChevronRight, LogOut } from 'lucide-react';
import { categoryColors } from '@/Lib/category-colors';
import type { Group } from '@/types';

interface Props {
    groups: Group[];
}

export default function MarkerGroups({ groups }: Props) {
    const tournamentName = (groups[0] as any)?.tournament?.name ?? '';

    return (
        <>
            <Head title="Sélection du groupe" />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Marqueur</p>
                            <p className="text-[10px] text-muted-foreground">{tournamentName}</p>
                        </div>
                    </div>
                    <Link href={route('marqueur.logout')} method="post" as="button" className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground">
                        <LogOut className="w-5 h-5" />
                    </Link>
                </div>

                <div className="max-w-lg mx-auto px-4 py-6">
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-foreground">Sélectionnez un groupe</h1>
                        <p className="text-sm text-muted-foreground mt-1">{groups.length} groupe{groups.length !== 1 ? 's' : ''} assigné{groups.length !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="space-y-3">
                        {groups.map((group) => {
                            const isConfirmed = !!group.scores_confirmed_at;
                            const progress = (group as any).scoring_progress ?? 0;

                            return (
                                <Link
                                    key={group.id}
                                    href={route('marqueur.scoring', group.id)}
                                    className="block glass-card !p-0 overflow-hidden hover:border-primary/30 transition-all active:scale-[0.98]"
                                >
                                    {/* Progress bar */}
                                    <div className="h-1 bg-surface">
                                        <div
                                            className={`h-full transition-all ${isConfirmed ? 'bg-emerald-500' : progress > 0 ? 'bg-primary' : 'bg-transparent'}`}
                                            style={{ width: `${isConfirmed ? 100 : progress}%` }}
                                        />
                                    </div>

                                    <div className="px-5 py-4 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isConfirmed ? 'bg-emerald-500/15' : 'bg-primary/10'}`}>
                                            {isConfirmed ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <span className="text-lg font-black text-primary">{group.code.slice(-2)}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-foreground">{group.code}</span>
                                                {group.category && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColors[group.category.name] ?? 'bg-surface-hover text-foreground'}`}>
                                                        {group.category.short_name ?? group.category.name}
                                                    </span>
                                                )}
                                                {isConfirmed && (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">Confirmé</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {group.tee_time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {group.players?.length ?? 0} joueur{(group.players?.length ?? 0) !== 1 ? 's' : ''}
                                                </span>
                                                {group.course && (
                                                    <span className="flex items-center gap-1 text-violet-400">
                                                        <MapPin className="w-3 h-3" />
                                                        {group.course.name}
                                                    </span>
                                                )}
                                                <span className="text-amber-400 font-medium">Trous {group.hole_start}-{group.hole_end}</span>
                                            </div>

                                            {progress > 0 && !isConfirmed && (
                                                <p className="text-[10px] text-primary font-medium mt-1">{progress}% complété</p>
                                            )}
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
