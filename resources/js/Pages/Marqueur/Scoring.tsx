import { useState, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Wifi, WifiOff, Minus, Plus, LogOut, ArrowLeft, Menu, RefreshCw, AlertTriangle, CheckCircle2, Shield, X, BarChart3, Loader2 } from 'lucide-react';
import { categoryDotColors } from '@/Lib/category-colors';
import { useOfflineScores } from '@/Hooks/useOfflineScores';
import type { Player, Hole, Group, Score, CategoryPar } from '@/types';

interface Props {
    group: Group;
    groupCode: string;
    players: Player[];
    holes: Hole[];
    existingScores: Record<string, Score[]>;
    tournamentId: string;
    categoryPars: CategoryPar[];
    hasMultipleGroups?: boolean;
    scoreConfirmationEnabled?: boolean;
}

function getScoreLabel(score: number, par: number) {
    const diff = score - par;
    if (diff <= -2) return { label: 'Eagle', bg: 'bg-amber-500', text: 'text-amber-950' };
    if (diff === -1) return { label: 'Birdie', bg: 'bg-emerald-500', text: 'text-emerald-950' };
    if (diff === 0) return { label: 'Par', bg: 'bg-white/20', text: 'text-foreground' };
    if (diff === 1) return { label: 'Bogey', bg: 'bg-orange-500', text: 'text-orange-950' };
    return { label: 'Dbl+', bg: 'bg-red-500', text: 'text-red-950' };
}

interface PhaseStats {
    phase: number;
    holes: { hole_number: number; par: number; strokes: number; diff: number; stableford: number }[];
    total_strokes: number;
    total_par: number;
    total_stableford: number;
}

interface PlayerStatsData {
    player: { name: string; handicap: number; category: string | null };
    phases: PhaseStats[];
}

function countByDiff(holes: PhaseStats['holes']) {
    const counts = { eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 };
    for (const h of holes) {
        if (h.diff <= -2) counts.eagle++;
        else if (h.diff === -1) counts.birdie++;
        else if (h.diff === 0) counts.par++;
        else if (h.diff === 1) counts.bogey++;
        else counts.double++;
    }
    return counts;
}

function PlayerStatsModal({ player, onClose }: { player: Player; onClose: () => void }) {
    const [data, setData] = useState<PlayerStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activePhase, setActivePhase] = useState<number | 'total'>('total');

    useState(() => {
        fetch(route('marqueur.playerStats', player.id))
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    });

    const allHoles = data ? data.phases.flatMap((p) => p.holes) : [];
    const phaseData = data
        ? activePhase === 'total'
            ? { holes: allHoles, total_strokes: data.phases.reduce((s, p) => s + p.total_strokes, 0), total_par: data.phases.reduce((s, p) => s + p.total_par, 0), total_stableford: data.phases.reduce((s, p) => s + p.total_stableford, 0) }
            : data.phases.find((p) => p.phase === activePhase)
        : null;

    const counts = phaseData ? countByDiff(phaseData.holes) : null;
    const totalDiff = phaseData ? phaseData.total_strokes - phaseData.total_par : 0;
    const diffStr = totalDiff === 0 ? 'E' : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{player.name}</p>
                            <p className="text-xs text-muted-foreground">Hdcp {player.handicap}{player.category?.name ? ` · ${player.category.name}` : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-16 px-4">
                        <p className="text-sm text-muted-foreground">Impossible de charger les statistiques</p>
                    </div>
                )}

                {data && phaseData && counts && (
                    <>
                        {/* Phase tabs */}
                        {data.phases.length > 1 && (
                            <div className="flex gap-1.5 px-5 py-3 border-b border-border shrink-0 overflow-x-auto">
                                {data.phases.map((p) => (
                                    <button
                                        key={p.phase}
                                        onClick={() => setActivePhase(p.phase)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activePhase === p.phase ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'}`}
                                    >
                                        Phase {p.phase}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setActivePhase('total')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activePhase === 'total' ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'}`}
                                >
                                    Total
                                </button>
                            </div>
                        )}

                        {/* Summary bar */}
                        <div className="grid grid-cols-3 gap-3 px-5 py-3 border-b border-border shrink-0">
                            <div className="text-center">
                                <p className="text-lg font-black text-foreground">{phaseData.total_strokes}</p>
                                <p className="text-[10px] text-muted-foreground">Coups</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-lg font-black ${totalDiff < 0 ? 'text-emerald-400' : totalDiff === 0 ? 'text-foreground' : 'text-red-400'}`}>{diffStr}</p>
                                <p className="text-[10px] text-muted-foreground">vs Par</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-amber-400">{phaseData.total_stableford}</p>
                                <p className="text-[10px] text-muted-foreground">Stableford</p>
                            </div>
                        </div>

                        {/* Distribution */}
                        <div className="flex items-center justify-center gap-2 px-5 py-3 border-b border-border shrink-0 flex-wrap">
                            {counts.eagle > 0 && <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold">Eagle {counts.eagle}</span>}
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold">Birdie {counts.birdie}</span>
                            <span className="px-2 py-1 rounded-lg bg-white/10 text-foreground text-xs font-bold">Par {counts.par}</span>
                            <span className="px-2 py-1 rounded-lg bg-orange-500/15 text-orange-400 text-xs font-bold">Bogey {counts.bogey}</span>
                            {counts.double > 0 && <span className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold">Dbl+ {counts.double}</span>}
                        </div>

                        {/* Hole-by-hole table */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-card">
                                    <tr className="border-b border-border text-muted-foreground">
                                        <th className="px-4 py-2 text-left font-semibold">Trou</th>
                                        <th className="px-2 py-2 text-center font-semibold">Par</th>
                                        <th className="px-2 py-2 text-center font-semibold">Coups</th>
                                        <th className="px-2 py-2 text-center font-semibold">+/-</th>
                                        <th className="px-4 py-2 text-center font-semibold">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {phaseData.holes.map((h, i) => (
                                        <tr key={i} className="border-b border-border/50">
                                            <td className="px-4 py-2 font-bold text-foreground">{h.hole_number}</td>
                                            <td className="px-2 py-2 text-center text-muted-foreground">{h.par}</td>
                                            <td className="px-2 py-2 text-center font-bold text-foreground">{h.strokes}</td>
                                            <td className={`px-2 py-2 text-center font-bold ${h.diff < 0 ? 'text-emerald-400' : h.diff === 0 ? 'text-muted-foreground' : 'text-red-400'}`}>
                                                {h.diff === 0 ? 'E' : h.diff > 0 ? `+${h.diff}` : h.diff}
                                            </td>
                                            <td className="px-4 py-2 text-center font-bold text-amber-400">{h.stableford}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border bg-surface/50">
                                        <td className="px-4 py-2 font-bold text-foreground">Total</td>
                                        <td className="px-2 py-2 text-center font-bold text-muted-foreground">{phaseData.total_par}</td>
                                        <td className="px-2 py-2 text-center font-bold text-foreground">{phaseData.total_strokes}</td>
                                        <td className={`px-2 py-2 text-center font-bold ${totalDiff < 0 ? 'text-emerald-400' : totalDiff === 0 ? 'text-muted-foreground' : 'text-red-400'}`}>{diffStr}</td>
                                        <td className="px-4 py-2 text-center font-bold text-amber-400">{phaseData.total_stableford}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PlayerScoreCard({ player, score, par, onIncrement, onDecrement, disabled, onTapPlayer }: {
    player: Player; score: number; par: number; onIncrement: () => void; onDecrement: () => void; disabled?: boolean; onTapPlayer: () => void;
}) {
    const scoreInfo = getScoreLabel(score, par);
    return (
        <div className="glass-card">
            <button type="button" onClick={onTapPlayer} className="flex items-center gap-3 mb-4 w-full text-left">
                <div className={`w-3 h-3 rounded-full shrink-0 ${categoryDotColors[player.category?.name ?? ''] ?? 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{player.name}</p>
                    <p className="text-xs text-muted-foreground">Handicap {player.handicap}</p>
                </div>
                <BarChart3 className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
            <div className="flex items-center justify-center gap-4">
                <button onClick={onDecrement} disabled={disabled} className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                    <Minus className="w-6 h-6 text-foreground" />
                </button>
                <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-2xl ${scoreInfo.bg} flex items-center justify-center`}>
                        <span className={`text-3xl font-bold ${scoreInfo.text}`}>{score}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1.5">{scoreInfo.label}</span>
                </div>
                <button onClick={onIncrement} disabled={disabled} className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                    <Plus className="w-6 h-6 text-foreground" />
                </button>
            </div>
        </div>
    );
}

export default function MarkerScoring({ group, groupCode, players, holes, existingScores, tournamentId, categoryPars, hasMultipleGroups, scoreConfirmationEnabled }: Props) {
    const [currentHole, setCurrentHole] = useState(0);
    const [statsPlayer, setStatsPlayer] = useState<Player | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmedName, setConfirmedName] = useState('');
    const [confirming, setConfirming] = useState(false);
    const isConfirmed = !!group.scores_confirmed_at;

    // Build category par lookup
    const catParMap = new Map<string, number>();
    for (const cp of categoryPars) {
        catParMap.set(`${cp.category_id}:${cp.hole_id}`, cp.par);
    }
    const getParForPlayer = (hole: Hole, player: Player) => {
        if (player.category_id) {
            const catPar = catParMap.get(`${player.category_id}:${hole.id}`);
            if (catPar !== undefined) return catPar;
        }
        return hole.par;
    };

    const {
        scores,
        updateScore,
        saveHole,
        isOnline,
        pendingCount,
        syncStatus,
        lastSyncTime,
        forceSyncNow,
    } = useOfflineScores({
        groupId: group.id,
        phase: group.phase,
        players,
        holes,
        existingScores,
        saveUrl: route('marqueur.save', group.id),
        csrfRefreshUrl: route('marqueur.login'),
        categoryPars,
    });

    const hole = holes[currentHole];
    if (!hole) return null;

    const goNext = () => {
        saveHole(currentHole);
        setCurrentHole((h) => Math.min(holes.length - 1, h + 1));
    };

    const goPrev = () => setCurrentHole((h) => Math.max(0, h - 1));

    const handleFinish = () => {
        saveHole(currentHole);
        if (scoreConfirmationEnabled) {
            setShowConfirmModal(true);
        } else {
            // Redirect to groups or login
            if (hasMultipleGroups) {
                window.location.href = route('marqueur.groups');
            } else {
                window.location.href = route('marqueur.login');
            }
        }
    };

    const handleConfirmScores = () => {
        if (!confirmedName.trim()) return;
        setConfirming(true);
        router.post(route('marqueur.confirm', group.id), { confirmed_by_name: confirmedName }, {
            onSuccess: () => { setShowConfirmModal(false); setConfirming(false); },
            onError: () => setConfirming(false),
        });
    };

    // Status bar config
    const statusConfig = (() => {
        if (!isOnline) return { icon: WifiOff, text: 'Mode hors ligne', color: 'amber', bg: 'bg-amber-500/10' };
        if (syncStatus === 'syncing') return { icon: RefreshCw, text: 'Synchronisation...', color: 'blue', bg: 'bg-blue-500/10' };
        if (syncStatus === 'error') return { icon: AlertTriangle, text: 'Erreur de sync', color: 'red', bg: 'bg-red-500/10' };
        return { icon: Wifi, text: 'Connecté', color: 'emerald', bg: 'bg-emerald-500/10' };
    })();

    const StatusIcon = statusConfig.icon;

    return (
        <>
            <Head title={`Marqueur - ${groupCode}`} />
            <div className="min-h-screen bg-background flex flex-col">
                {/* Top bar */}
                <div className="sticky top-0 z-40 bg-card border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    {hasMultipleGroups ? (
                        <Link href={route('marqueur.groups')} className="p-2 rounded-lg hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </Link>
                    ) : (
                        <div className="w-9" />
                    )}
                    <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{groupCode}</p>
                        <p className="text-xs text-muted-foreground">
                            {group.phase > 1 && `Phase ${group.phase} · `}Trou {currentHole + 1}/{holes.length}
                        </p>
                    </div>
                    <Link href={route('marqueur.logout')} method="post" as="button" className="p-2 rounded-lg hover:bg-white/10">
                        <LogOut className="w-5 h-5 text-muted-foreground" />
                    </Link>
                </div>

                {/* Sync status bar */}
                <div className={`px-4 py-2 flex items-center gap-2 ${statusConfig.bg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 text-${statusConfig.color}-400 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span className={`text-xs font-medium text-${statusConfig.color}-400`}>
                        {statusConfig.text}
                    </span>
                    {pendingCount > 0 && (
                        <button
                            onClick={forceSyncNow}
                            className={`ml-auto text-xs font-medium text-${statusConfig.color}-400 bg-${statusConfig.color}-500/20 px-2 py-0.5 rounded-full`}
                        >
                            {pendingCount} en attente
                        </button>
                    )}
                    {pendingCount === 0 && lastSyncTime && (
                        <span className="ml-auto text-xs text-emerald-400/70">Synchro OK</span>
                    )}
                </div>

                {/* Confirmed banner */}
                {scoreConfirmationEnabled && isConfirmed && (
                    <div className="px-4 py-3 flex items-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">
                            Scores confirmés par {group.confirmed_by_name}
                        </span>
                    </div>
                )}

                {/* Hole header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={goPrev} disabled={currentHole === 0} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center disabled:opacity-30">
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="text-center">
                            <p className="text-xs font-medium text-white/70 uppercase tracking-widest">Trou</p>
                            <p className="text-5xl font-black text-white">{hole.number}</p>
                        </div>
                        <button onClick={() => currentHole < holes.length - 1 && goNext()} disabled={currentHole === holes.length - 1} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center disabled:opacity-30">
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="text-center text-sm text-white/80">Par {group.category_id ? (catParMap.get(`${group.category_id}:${hole.id}`) ?? hole.par) : hole.par} &bull; {hole.distance}m</p>
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                        {holes.map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentHole ? 'bg-white' : i < currentHole ? 'bg-white/40' : 'bg-white/15'}`} />
                        ))}
                    </div>
                </div>

                {/* Player score cards */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {players.map((player, idx) => (
                        <PlayerScoreCard
                            key={player.id}
                            player={player}
                            score={scores[idx][currentHole]}
                            par={getParForPlayer(hole, player)}
                            onIncrement={() => updateScore(idx, currentHole, 1)}
                            onDecrement={() => updateScore(idx, currentHole, -1)}
                            disabled={scoreConfirmationEnabled && isConfirmed}
                            onTapPlayer={() => setStatsPlayer(player)}
                        />
                    ))}
                </div>

                {/* Bottom button */}
                <div className="sticky bottom-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
                    {scoreConfirmationEnabled && isConfirmed ? (
                        <div className="w-full h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-5 h-5" />
                            Scores confirmés
                        </div>
                    ) : (
                        <button
                            onClick={currentHole < holes.length - 1 ? goNext : handleFinish}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-14 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
                        >
                            {currentHole < holes.length - 1 ? (<>Trou suivant<ChevronRight className="w-5 h-5" /></>) : 'Terminer le parcours'}
                        </button>
                    )}
                </div>

                {/* Player stats modal */}
                {statsPlayer && <PlayerStatsModal player={statsPlayer} onClose={() => setStatsPlayer(null)} />}

                {/* Confirmation modal */}
                {showConfirmModal && !isConfirmed && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-5 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground">Confirmer les scores</h3>
                                <p className="text-xs text-muted-foreground mt-1">Récapitulatif des scores pour le groupe {groupCode}</p>
                            </div>
                            <div className="px-6 py-4 max-h-60 overflow-y-auto space-y-2">
                                {players.map((player, pIdx) => {
                                    const total = scores[pIdx].reduce((sum: number, s: number) => sum + s, 0);
                                    const totalPar = holes.reduce((sum, h) => sum + getParForPlayer(h, player), 0);
                                    const diff = total - totalPar;
                                    const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
                                    return (
                                        <div key={player.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                            <span className="text-sm font-medium text-foreground">{player.name}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-foreground">{total}</span>
                                                <span className={`ml-2 text-xs font-medium ${diff < 0 ? 'text-emerald-400' : diff === 0 ? 'text-muted-foreground' : 'text-red-400'}`}>({diffStr})</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="px-6 py-4 border-t border-border space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Votre nom (confirmation)</label>
                                    <input
                                        type="text"
                                        value={confirmedName}
                                        onChange={(e) => setConfirmedName(e.target.value)}
                                        placeholder="Nom du marqueur"
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 rounded-xl bg-surface border border-border text-foreground text-sm font-medium hover:bg-surface-hover"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleConfirmScores}
                                        disabled={!confirmedName.trim() || confirming}
                                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {confirming ? 'Confirmation...' : 'Confirmer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
