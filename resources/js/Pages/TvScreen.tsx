import { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Trophy, X, Pause, Play, Maximize, Minimize } from 'lucide-react';
import { buildLeaderboard } from '@/Lib/scoring';
import { categoryDotColors, categoryColors } from '@/Lib/category-colors';
import { useRealtimeScores } from '@/Hooks/useRealtimeScores';
import type { Tournament, Player, Score, Hole, Category } from '@/types';

interface Props {
    tournament: Tournament | null;
    players: Player[];
    scores: Score[];
    holes: Hole[];
    categories: Category[];
}

function PositionCell({ position }: { position: number }) {
    if (position === 1) return <span className="w-10 h-10 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center text-lg font-bold">1</span>;
    if (position === 2) return <span className="w-10 h-10 rounded-xl bg-slate-400 text-slate-950 flex items-center justify-center text-lg font-bold">2</span>;
    if (position === 3) return <span className="w-10 h-10 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center text-lg font-bold">3</span>;
    return <span className="w-10 h-10 rounded-xl bg-white/10 text-muted-foreground flex items-center justify-center text-lg font-bold">{position}</span>;
}

export default function TvScreen({ tournament, players, scores, holes, categories }: Props) {
    useRealtimeScores(tournament?.id);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const catIdsRef = useRef<string[]>([]);
    catIdsRef.current = ['all', ...(categories?.map((c) => c.id) ?? [])];

    useEffect(() => {
        if (isPaused || !categories?.length) return;
        const interval = setInterval(() => {
            const ids = catIdsRef.current;
            setActiveCategoryId((prev) => {
                const currentIdx = prev === null ? 0 : ids.indexOf(prev);
                const nextIdx = (currentIdx + 1) % ids.length;
                const next = ids[nextIdx];
                setAnimKey((k) => k + 1);
                return next === 'all' ? null : next;
            });
        }, 8000);
        return () => clearInterval(interval);
    }, [isPaused, categories?.length]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const playersWithCategory = players.map((p) => ({
        ...p,
        category: p.category ?? categories.find((c) => c.id === p.category_id) ?? null,
    }));

    const leaderboard = buildLeaderboard(playersWithCategory, scores, holes, activeCategoryId ?? undefined, 'stroke').slice(0, 10);

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const activeCatName = activeCategoryId ? categories?.find((c) => c.id === activeCategoryId)?.name ?? 'Tous' : 'Tous';

    return (
        <>
            <Head title="Écran TV" />
            <div ref={containerRef} className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col overflow-hidden">
                <Link href={route('classement')} className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5 text-white/60" />
                </Link>

                <header className="flex items-center justify-between px-16 py-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">{tournament?.name ?? ''}</h1>
                            <p className="text-base text-white/50">
                                {tournament?.club} &bull; {tournament?.start_date ? new Date(tournament.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                {tournament?.end_date && tournament.end_date !== tournament.start_date && (
                                    <> – {new Date(tournament.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-white/80">{activeCatName}</span>
                        <button onClick={() => setIsPaused(!isPaused)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            {isPaused ? <Play className="w-5 h-5 text-white/60" /> : <Pause className="w-5 h-5 text-white/60" />}
                        </button>
                        <button onClick={toggleFullscreen} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            {isFullscreen ? <Minimize className="w-5 h-5 text-white/60" /> : <Maximize className="w-5 h-5 text-white/60" />}
                        </button>
                    </div>
                </header>

                <div className="flex items-center justify-center gap-8 py-4">
                    <button onClick={() => { setActiveCategoryId(null); setIsPaused(true); setAnimKey((k) => k + 1); }} className="flex flex-col items-center gap-2 group">
                        <div className={`rounded-full transition-all duration-300 ${!activeCategoryId ? 'w-4 h-4 bg-white scale-125 shadow-lg' : 'w-3 h-3 bg-white/30 group-hover:scale-110'}`} />
                        <span className={`text-xs font-medium transition-colors ${!activeCategoryId ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}>Tous</span>
                    </button>
                    {categories?.map((cat) => {
                        const isActive = activeCategoryId === cat.id;
                        return (
                            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setIsPaused(true); setAnimKey((k) => k + 1); }} className="flex flex-col items-center gap-2 group">
                                <div className={`rounded-full transition-all duration-300 ${isActive ? `w-4 h-4 ${categoryDotColors[cat.name] ?? 'bg-white'} scale-125 shadow-lg` : `w-3 h-3 ${categoryDotColors[cat.name] ?? 'bg-white'}/40 group-hover:scale-110`}`} />
                                <span className={`text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}>{cat.short_name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 px-16 py-4 overflow-hidden">
                    <div className="h-full rounded-3xl bg-white/5 border border-white/10 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-[80px_1fr_120px_120px_120px] px-8 py-4 border-b border-white/10">
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Pos</span>
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Joueur</span>
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest text-center">Trous</span>
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest text-center">Total</span>
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest text-right">Score</span>
                        </div>
                        <div className="flex-1 overflow-hidden" key={animKey}>
                            {leaderboard.length === 0 && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-lg text-white/30">Aucun score enregistre</p>
                                </div>
                            )}
                            {leaderboard.map((entry, idx) => {
                                const position = idx + 1;
                                const scoreColor = entry.strokeToPar < 0 ? 'text-emerald-400' : entry.strokeToPar === 0 ? 'text-white' : 'text-red-400';
                                const sign = entry.strokeToPar > 0 ? '+' : '';
                                return (
                                    <div key={entry.player.id} className={`grid grid-cols-[80px_1fr_120px_120px_120px] items-center px-8 py-4 border-b border-white/5 ${position === 1 ? 'bg-gradient-to-r from-amber-500/15 to-transparent' : ''}`} style={{ animation: `fadeSlideIn 0.4s ease-out ${idx * 0.08}s both` }}>
                                        <div><PositionCell position={position} /></div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${categoryDotColors[entry.categoryName] ?? 'bg-gray-500'}`} />
                                            <span className="text-lg font-semibold text-white">{entry.player.name}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[entry.categoryName] ?? 'bg-white/10 text-white'}`}>{entry.categoryName}</span>
                                        </div>
                                        <span className="text-base text-white/60 text-center">{entry.holesPlayed}/18</span>
                                        <span className="text-xl font-bold text-white text-center">{entry.totalStrokes}</span>
                                        <span className={`text-xl font-bold ${scoreColor} text-right`}>{entry.strokeToPar === 0 ? 'E' : `${sign}${entry.strokeToPar}`}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className="flex items-center justify-between px-16 py-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-white/50">Mise à jour en temps réel &bull; {now}</span>
                    </div>
                    <span className="text-sm text-white/30">Propulsé par MGC Score</span>
                </footer>
            </div>
        </>
    );
}
