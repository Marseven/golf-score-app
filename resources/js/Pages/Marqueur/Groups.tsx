import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Target, Users, Clock, CheckCircle2, ChevronRight, LogOut, Search } from 'lucide-react';
import { categoryColors, categoryDotColors } from '@/Lib/category-colors';
import { countryCodeToFlag } from '@/Lib/countries';
import type { Group } from '@/types';

interface Props {
    groups: Group[];
}

export default function MarkerGroups({ groups }: Props) {
    const tournamentName = (groups[0] as any)?.tournament?.name ?? '';
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return groups;
        return groups.filter((g) => {
            if (g.code.toLowerCase().includes(q)) return true;
            if (g.category?.name?.toLowerCase().includes(q)) return true;
            return g.players?.some((p) => p.name.toLowerCase().includes(q)) ?? false;
        });
    }, [groups, search]);

    const totalPlayers = groups.reduce((sum, g) => sum + (g.players?.length ?? 0), 0);

    return (
        <>
            <Head title="Sélection du groupe" />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
                    {/* Title + stats */}
                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-foreground">Mes groupes</h1>
                        <p className="text-xs text-muted-foreground mt-1">{groups.length} groupe{groups.length !== 1 ? 's' : ''} · {totalPlayers} joueur{totalPlayers !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un joueur ou groupe..."
                            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Groups list */}
                    {filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Aucun groupe trouvé</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((group) => {
                                const isConfirmed = !!group.scores_confirmed_at;
                                const progress = (group as any).scoring_progress ?? 0;
                                const playerNames = group.players?.map((p) => p.name) ?? [];

                                return (
                                    <Link
                                        key={group.id}
                                        href={route('marqueur.scoring', group.id)}
                                        className="block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all active:scale-[0.98]"
                                    >
                                        {/* Progress bar */}
                                        <div className="h-1.5 bg-surface">
                                            <div
                                                className={`h-full rounded-full transition-all ${isConfirmed ? 'bg-emerald-500' : progress > 0 ? 'bg-primary' : 'bg-transparent'}`}
                                                style={{ width: `${isConfirmed ? 100 : progress}%` }}
                                            />
                                        </div>

                                        <div className="p-4">
                                            {/* Top row: code + time + status */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isConfirmed ? 'bg-emerald-500/15' : 'bg-primary/10'}`}>
                                                        {isConfirmed ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <span className="text-sm font-black text-primary">{group.code.slice(-2)}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-bold text-foreground">{group.code}</span>
                                                            {group.phase > 1 && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">Phase {group.phase}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Clock className="w-3 h-3" />{group.tee_time}
                                                            </span>
                                                            {group.category && (
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColors[group.category.name] ?? 'bg-surface-hover text-foreground'}`}>
                                                                    {group.category.short_name ?? group.category.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {progress > 0 && !isConfirmed && (
                                                        <span className="text-xs font-bold text-primary">{progress}%</span>
                                                    )}
                                                    {isConfirmed && (
                                                        <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">Confirmé</span>
                                                    )}
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground/20" />
                                                </div>
                                            </div>

                                            {/* Players */}
                                            {playerNames.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(group.players ?? []).map((p) => (
                                                        <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface text-xs text-foreground">
                                                            {p.nationality && <span className="text-sm leading-none">{countryCodeToFlag(p.nationality)}</span>}
                                                            <span className="font-medium">{p.name}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
