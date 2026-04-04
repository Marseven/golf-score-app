import { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Shield, LogOut, Users, Target, CheckCircle2, Clock, Search, Save } from 'lucide-react';
import { categoryColors, categoryDotColors } from '@/Lib/category-colors';
import { countryCodeToFlag } from '@/Lib/countries';
import type { Tournament, Group, Hole, Player, Category } from '@/types';

interface DashboardGroup extends Group {
    scoring_progress: number;
    players?: Player[];
}

interface Props {
    tournament: Tournament;
    groups: DashboardGroup[];
    holes: Hole[];
    manualPlayers?: Player[];
}

export default function CaddyMasterDashboard({ tournament, groups, holes, manualPlayers }: Props) {
    const [activePhase, setActivePhase] = useState(() => {
        // Default to the highest phase that has groups with players
        const phases = [...new Set(groups.filter((g) => (g.players?.length ?? 0) > 0).map((g) => g.phase ?? 1))];
        return phases.length > 0 ? Math.max(...phases) : 1;
    });
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Get unique phases and categories from groups
    const phases = useMemo(() => {
        const set = new Set(groups.map((g) => g.phase ?? 1));
        return [...set].sort((a, b) => a - b);
    }, [groups]);

    const categoriesFromGroups = useMemo(() => {
        const catMap = new Map<string, Category>();
        groups.forEach((g) => {
            if (g.category) catMap.set(g.category.id, g.category);
            g.players?.forEach((p) => {
                if (p.category) catMap.set(p.category.id, p.category);
            });
        });
        return [...catMap.values()];
    }, [groups]);

    // Filter groups
    const filteredGroups = useMemo(() => {
        return groups.filter((g) => {
            if ((g.phase ?? 1) !== activePhase) return false;
            if ((g.players?.length ?? 0) === 0) return false;
            if (activeCategoryId && g.category_id !== activeCategoryId) {
                // Also check if any player in the group matches the category
                const hasPlayer = g.players?.some((p) => p.category_id === activeCategoryId);
                if (!hasPlayer) return false;
            }
            if (search) {
                const q = search.toLowerCase();
                if (g.code.toLowerCase().includes(q)) return true;
                return g.players?.some((p) => p.name.toLowerCase().includes(q)) ?? false;
            }
            return true;
        });
    }, [groups, activePhase, activeCategoryId, search]);

    const completedGroups = filteredGroups.filter((g) => g.scores_confirmed_at);
    const totalProgress = filteredGroups.length > 0
        ? Math.round(filteredGroups.reduce((sum, g) => sum + g.scoring_progress, 0) / filteredGroups.length)
        : 0;

    return (
        <>
            <Head title="Caddie Master - Tableau de bord" />
            <div className="min-h-screen bg-background">
                {/* Top bar */}
                <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{tournament.name}</p>
                            <p className="text-xs text-muted-foreground">Caddie Master</p>
                        </div>
                    </div>
                    <Link href={route('caddie-master.logout')} method="post" as="button" className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground">
                        <LogOut className="w-5 h-5" />
                    </Link>
                </div>

                <div className="p-4 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="glass-card flex flex-col items-center py-3">
                            <p className="text-2xl font-bold text-foreground">{filteredGroups.length}</p>
                            <p className="text-[10px] text-muted-foreground">Groupes</p>
                        </div>
                        <div className="glass-card flex flex-col items-center py-3">
                            <p className="text-2xl font-bold text-emerald-400">{completedGroups.length}</p>
                            <p className="text-[10px] text-muted-foreground">Complétés</p>
                        </div>
                        <div className="glass-card flex flex-col items-center py-3">
                            <p className="text-2xl font-bold text-amber-400">{totalProgress}%</p>
                            <p className="text-[10px] text-muted-foreground">Progression</p>
                        </div>
                    </div>

                    {/* Phase tabs */}
                    {phases.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {phases.map((phase) => {
                                const phaseGroups = groups.filter((g) => (g.phase ?? 1) === phase && (g.players?.length ?? 0) > 0);
                                return (
                                    <button
                                        key={phase}
                                        onClick={() => setActivePhase(phase)}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activePhase === phase ? 'bg-amber-500 text-white shadow-sm' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                                    >
                                        Phase {phase} ({phaseGroups.length})
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Category filter */}
                    {categoriesFromGroups.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            <button
                                onClick={() => setActiveCategoryId(null)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${!activeCategoryId ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                            >
                                Tous
                            </button>
                            {categoriesFromGroups.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategoryId(cat.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeCategoryId === cat.id ? `${categoryColors[cat.name] ?? 'bg-primary text-primary-foreground'} shadow-sm` : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                                >
                                    {cat.short_name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un joueur ou groupe..."
                            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Groups */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredGroups.map((group) => (
                            <Link
                                key={group.id}
                                href={route('caddie-master.scoring', group.id)}
                                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all active:scale-[0.98]"
                            >
                                {/* Progress bar */}
                                <div className="h-1.5 bg-surface">
                                    <div
                                        className={`h-full rounded-full transition-all ${group.scores_confirmed_at ? 'bg-emerald-500' : group.scoring_progress > 0 ? 'bg-primary' : 'bg-transparent'}`}
                                        style={{ width: `${group.scoring_progress}%` }}
                                    />
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">{group.code}</span>
                                            {group.category && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColors[group.category.name] ?? 'bg-surface-hover text-foreground'}`}>
                                                    {group.category.short_name}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />{group.tee_time}
                                            </span>
                                        </div>
                                        {group.scores_confirmed_at ? (
                                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">Confirmé</span>
                                        ) : group.scoring_progress > 0 ? (
                                            <span className="text-xs font-bold text-primary">{group.scoring_progress}%</span>
                                        ) : null}
                                    </div>

                                    {/* Players */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {(group.players ?? []).map((player) => (
                                            <span key={player.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface text-xs text-foreground">
                                                {player.nationality && <span className="text-sm leading-none">{countryCodeToFlag(player.nationality)}</span>}
                                                <span className="font-medium">{player.name}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredGroups.length === 0 && (
                        <div className="glass-card text-center py-12">
                            <Target className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Aucun groupe pour cette sélection</p>
                        </div>
                    )}

                    {/* Manual points entry for Stableford categories */}
                    {(manualPlayers ?? []).length > 0 && <ManualScoresSection players={manualPlayers!} />}
                </div>
            </div>
        </>
    );
}

function ManualScoresSection({ players }: { players: Player[] }) {
    const [editedScores, setEditedScores] = useState<Record<string, { points: number; ph: number }>>(() => {
        const initial: Record<string, { points: number; ph: number }> = {};
        players.forEach((p) => {
            initial[p.id] = { points: p.manual_points ?? 0, ph: p.playing_handicap ?? 0 };
        });
        return initial;
    });
    const [saving, setSaving] = useState(false);

    const hasChanges = players.some((p) => {
        const e = editedScores[p.id];
        return e && (e.points !== (p.manual_points ?? 0) || e.ph !== (p.playing_handicap ?? 0));
    });

    const handleSave = () => {
        setSaving(true);
        const scores = Object.entries(editedScores).map(([playerId, data]) => ({
            player_id: playerId,
            points: data.points,
            playing_handicap: data.ph,
        }));
        router.post(route('caddie-master.manualScores'), { scores }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    // Group by category
    const grouped = useMemo(() => {
        const map = new Map<string, Player[]>();
        players.forEach((p) => {
            const catName = p.category?.name ?? 'Autre';
            if (!map.has(catName)) map.set(catName, []);
            map.get(catName)!.push(p);
        });
        return map;
    }, [players]);

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Saisie des points</h2>
                        <p className="text-[10px] text-muted-foreground">Points totaux et PH par joueur</p>
                    </div>
                </div>
                {hasChanges && (
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        <Save className="w-4 h-4" />{saving ? '...' : 'Enregistrer'}
                    </button>
                )}
            </div>

            {[...grouped.entries()].map(([catName, catPlayers]) => (
                <div key={catName} className="mb-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{catName}</h3>
                    <div className="space-y-2">
                        {catPlayers.sort((a, b) => (editedScores[b.id]?.points ?? 0) - (editedScores[a.id]?.points ?? 0)).map((player) => {
                            const data = editedScores[player.id] ?? { points: 0, ph: 0 };
                            return (
                                <div key={player.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {player.nationality ? countryCodeToFlag(player.nationality) + ' ' : ''}{player.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-center">
                                            <label className="text-[9px] text-muted-foreground block">PH</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={data.ph}
                                                onChange={(e) => setEditedScores((prev) => ({ ...prev, [player.id]: { ...prev[player.id], ph: Number(e.target.value) } }))}
                                                className="w-16 h-9 text-center text-sm font-medium bg-surface border border-border rounded-lg focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <label className="text-[9px] text-amber-400 block font-bold">Points</label>
                                            <input
                                                type="number"
                                                value={data.points}
                                                onChange={(e) => setEditedScores((prev) => ({ ...prev, [player.id]: { ...prev[player.id], points: Number(e.target.value) } }))}
                                                className="w-16 h-9 text-center text-sm font-bold bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 focus:border-amber-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
