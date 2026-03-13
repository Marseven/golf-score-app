import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Wifi, WifiOff, Minus, Plus, LogOut, Menu, RefreshCw, AlertTriangle } from 'lucide-react';
import { categoryDotColors } from '@/Lib/category-colors';
import { useOfflineScores } from '@/Hooks/useOfflineScores';
import type { Player, Hole, Group, Score } from '@/types';

interface Props {
    group: Group;
    groupCode: string;
    players: Player[];
    holes: Hole[];
    existingScores: Record<string, Score[]>;
    tournamentId: string;
}

function getScoreLabel(score: number, par: number) {
    const diff = score - par;
    if (diff <= -2) return { label: 'Eagle', bg: 'bg-amber-500', text: 'text-amber-950' };
    if (diff === -1) return { label: 'Birdie', bg: 'bg-emerald-500', text: 'text-emerald-950' };
    if (diff === 0) return { label: 'Par', bg: 'bg-white/20', text: 'text-foreground' };
    if (diff === 1) return { label: 'Bogey', bg: 'bg-orange-500', text: 'text-orange-950' };
    return { label: 'Dbl+', bg: 'bg-red-500', text: 'text-red-950' };
}

function PlayerScoreCard({ player, score, par, onIncrement, onDecrement }: {
    player: Player; score: number; par: number; onIncrement: () => void; onDecrement: () => void;
}) {
    const scoreInfo = getScoreLabel(score, par);
    return (
        <div className="glass-card">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${categoryDotColors[player.category?.name ?? ''] ?? 'bg-gray-500'}`} />
                <div>
                    <p className="text-sm font-semibold text-foreground">{player.name}</p>
                    <p className="text-xs text-muted-foreground">Handicap {player.handicap}</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-4">
                <button onClick={onDecrement} className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95">
                    <Minus className="w-6 h-6 text-foreground" />
                </button>
                <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-2xl ${scoreInfo.bg} flex items-center justify-center`}>
                        <span className={`text-3xl font-bold ${scoreInfo.text}`}>{score}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1.5">{scoreInfo.label}</span>
                </div>
                <button onClick={onIncrement} className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95">
                    <Plus className="w-6 h-6 text-foreground" />
                </button>
            </div>
        </div>
    );
}

export default function MarkerScoring({ group, groupCode, players, holes, existingScores, tournamentId }: Props) {
    const [currentHole, setCurrentHole] = useState(0);

    const {
        scores,
        updateScore,
        saveHole,
        isOnline,
        pendingCount,
        syncStatus,
        lastSyncTime,
        forceSyncNow,
    } = useOfflineScores({ groupId: group.id, players, holes, existingScores });

    const hole = holes[currentHole];
    if (!hole) return null;

    const goNext = () => {
        saveHole(currentHole);
        setCurrentHole((h) => Math.min(holes.length - 1, h + 1));
    };

    const goPrev = () => setCurrentHole((h) => Math.max(0, h - 1));

    const handleFinish = () => {
        saveHole(currentHole);
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
                    <button className="p-2 rounded-lg hover:bg-white/10"><Menu className="w-5 h-5 text-foreground" /></button>
                    <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{groupCode}</p>
                        <p className="text-xs text-muted-foreground">Trou {currentHole + 1}/{holes.length}</p>
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
                    <p className="text-center text-sm text-white/80">Par {hole.par} &bull; {hole.distance}m</p>
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
                            par={hole.par}
                            onIncrement={() => updateScore(idx, currentHole, 1)}
                            onDecrement={() => updateScore(idx, currentHole, -1)}
                        />
                    ))}
                </div>

                {/* Bottom button */}
                <div className="sticky bottom-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
                    <button
                        onClick={currentHole < holes.length - 1 ? goNext : handleFinish}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-14 text-base font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                        {currentHole < holes.length - 1 ? (<>Trou suivant<ChevronRight className="w-5 h-5" /></>) : 'Terminer le parcours'}
                    </button>
                </div>
            </div>
        </>
    );
}
