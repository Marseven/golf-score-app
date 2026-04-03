import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Trophy, X, Pause, Play, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { buildLeaderboard } from '@/Lib/scoring';
import type { PenaltyData } from '@/Lib/scoring';
import { countryCodeToFlag } from '@/Lib/countries';
import { categoryDotColors, categoryColors } from '@/Lib/category-colors';
import { useRealtimeScores } from '@/Hooks/useRealtimeScores';
import type { Tournament, Player, Score, Hole, Category, Cut, CategoryPar } from '@/types';

interface Props {
    tournament: Tournament | null;
    players: Player[];
    scores: Score[];
    holes: Hole[];
    categories: Category[];
    cuts: Cut[];
    categoryPars: CategoryPar[];
    penalties?: PenaltyData[];
    logoUrl?: string | null;
    sponsorLogoUrl?: string | null;
}

function PositionBadge({ position }: { position: number }) {
    if (position === 1) return (
        <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30" />
            <span className="relative text-2xl">🥇</span>
        </div>
    );
    if (position === 2) return (
        <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-400/20" />
            <span className="relative text-2xl">🥈</span>
        </div>
    );
    if (position === 3) return (
        <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/20" />
            <span className="relative text-2xl">🥉</span>
        </div>
    );
    return (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <span className="text-2xl font-black text-white/50 tabular-nums">{position}</span>
        </div>
    );
}

function ScoreBadge({ strokeToPar, holesPlayed }: { strokeToPar: number; holesPlayed: number }) {
    if (holesPlayed === 0) return <span className="text-white/20 text-2xl font-bold">—</span>;
    const isUnder = strokeToPar < 0;
    const isEven = strokeToPar === 0;
    const sign = strokeToPar > 0 ? '+' : '';
    const display = isEven ? 'E' : `${sign}${strokeToPar}`;

    return (
        <div className={`inline-flex items-center justify-center min-w-[72px] px-4 py-2 rounded-xl text-2xl font-black tabular-nums ${
            isUnder
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : isEven
                    ? 'bg-white/10 text-white ring-1 ring-white/10'
                    : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
        }`}>
            {display}
        </div>
    );
}

export default function TvScreen({ tournament, players, scores, holes, categories, cuts, categoryPars, penalties, logoUrl, sponsorLogoUrl }: Props) {
    useRealtimeScores(tournament?.id);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [zoom, setZoom] = useState(100);
    const containerRef = useRef<HTMLDivElement>(null);
    const perPage = 10;

    // Only include categories that have players
    const activeCategories = useMemo(() =>
        (categories ?? []).filter((c) => players.some((p) => p.category_id === c.id)),
    [categories, players]);

    const catIdsRef = useRef<string[]>([]);
    catIdsRef.current = ['all', ...activeCategories.map((c) => c.id)];

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Build full leaderboard for current category to know total pages
    const playersWithCategory = useMemo(() => players.map((p) => ({
        ...p,
        category: p.category ?? categories.find((c) => c.id === p.category_id) ?? null,
    })), [players, categories]);

    const fullLeaderboard = useMemo(() =>
        buildLeaderboard(playersWithCategory, scores, holes, activeCategoryId ?? undefined, 'stroke', categories, undefined, undefined, categoryPars, penalties)
            .sort((a, b) => {
                // Withdrawn players go to the bottom
                if (a.player.is_withdrawn && !b.player.is_withdrawn) return 1;
                if (!a.player.is_withdrawn && b.player.is_withdrawn) return -1;
                // Cut players after non-cut players
                const aCut = a.player.cut_after_phase != null;
                const bCut = b.player.cut_after_phase != null;
                if (aCut && !bCut) return 1;
                if (!aCut && bCut) return -1;
                return 0;
            }),
    [playersWithCategory, scores, holes, activeCategoryId, categories, categoryPars, penalties]);

    const totalPages = Math.max(1, Math.ceil(fullLeaderboard.length / perPage));

    // Store data in refs so rotation interval doesn't re-create on data change
    const dataRef = useRef({ playersWithCategory, scores, holes, categories, categoryPars, penalties });
    dataRef.current = { playersWithCategory, scores, holes, categories, categoryPars, penalties };

    // Auto-rotation: paginate within category, then switch
    const rotationRef = useRef({ catIdx: 0, page: 0 });

    useEffect(() => {
        if (isPaused || !categories?.length) return;
        const interval = setInterval(() => {
            const ids = catIdsRef.current;
            const r = rotationRef.current;
            const d = dataRef.current;

            const currentCatId = ids[r.catIdx] === 'all' ? undefined : ids[r.catIdx];
            const entries = buildLeaderboard(d.playersWithCategory, d.scores, d.holes, currentCatId, 'stroke', d.categories, undefined, undefined, d.categoryPars, d.penalties);
            const catTotalPages = Math.max(1, Math.ceil(entries.length / perPage));

            if (r.page + 1 < catTotalPages) {
                r.page += 1;
                setCurrentPage(r.page);
                setAnimKey((k) => k + 1);
            } else {
                r.page = 0;
                r.catIdx = (r.catIdx + 1) % ids.length;
                const next = ids[r.catIdx];
                setCurrentPage(0);
                setActiveCategoryId(next === 'all' ? null : next);
                setAnimKey((k) => k + 1);
            }
        }, 20000);
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

    const leaderboard = fullLeaderboard.slice(currentPage * perPage, (currentPage + 1) * perPage);

    // Current phase = highest phase that has scores
    const currentPhase = useMemo(() => {
        if (!scores.length) return 1;
        return Math.max(...scores.map((s) => s.phase));
    }, [scores]);

    // Scores per phase per player: { playerId: { 1: {strokes, par}, 2: {strokes, par}, ... } }
    const phaseScoresMap = useMemo(() => {
        if (tournament?.phase_count === 1) return null;
        const holeMap = new Map(holes.map((h) => [h.id, h]));
        const map: Record<string, Record<number, { strokes: number; par: number }>> = {};
        for (const s of scores) {
            const hole = holeMap.get(s.hole_id);
            if (!hole) continue;
            if (!map[s.player_id]) map[s.player_id] = {};
            if (!map[s.player_id][s.phase]) map[s.player_id][s.phase] = { strokes: 0, par: 0 };
            map[s.player_id][s.phase].strokes += s.strokes;
            map[s.player_id][s.phase].par += hole.par;
        }
        return map;
    }, [scores, holes, tournament?.phase_count]);

    const activeCatName = activeCategoryId ? categories?.find((c) => c.id === activeCategoryId)?.name ?? 'Classement Général' : 'Classement Général';
    const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <>
            <Head title="Écran TV" />
            <style>{`
                @keyframes tvSlideIn {
                    from { opacity: 0; transform: translateX(-40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes tvFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                @keyframes tickerScroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .tv-row { animation: tvSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
                .tv-leader-glow {
                    background: linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 40%, transparent 100%);
                    border-left: 3px solid rgba(245,158,11,0.6);
                }
            `}</style>

            <div ref={containerRef} className="fixed inset-0 overflow-hidden" style={{
                background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1520 40%, #091215 100%)',
            }}>
            <div className="flex flex-col h-full" style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                width: `${10000 / zoom}%`,
                height: `${10000 / zoom}%`,
                marginLeft: `${(100 - 10000 / zoom) / 2}%`,
            }}>
                {/* Ambient light effects */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[150px] pointer-events-none" />

                {/* Watermark logo */}
                <img src="/logo.jpeg" alt="" className="absolute inset-0 m-auto w-[500px] h-[500px] object-contain opacity-[0.06] pointer-events-none select-none" style={{ mixBlendMode: 'screen' }} />

                {/* Close button */}
                <Link href={route('classement')} className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-sm border border-white/5">
                    <X className="w-5 h-5 text-white/40" />
                </Link>

                {/* Controls */}
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                    <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-sm border border-white/5" title="Réduire">
                        <ZoomOut className="w-4 h-4 text-white/40" />
                    </button>
                    <span className="text-[10px] text-white/30 font-mono w-8 text-center">{zoom}%</span>
                    <button onClick={() => setZoom((z) => Math.min(150, z + 10))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-sm border border-white/5" title="Agrandir">
                        <ZoomIn className="w-4 h-4 text-white/40" />
                    </button>
                    <button onClick={() => setIsPaused(!isPaused)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-sm border border-white/5">
                        {isPaused ? <Play className="w-4 h-4 text-white/40" /> : <Pause className="w-4 h-4 text-white/40" />}
                    </button>
                    <button onClick={toggleFullscreen} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-sm border border-white/5">
                        {isFullscreen ? <Minimize className="w-4 h-4 text-white/40" /> : <Maximize className="w-4 h-4 text-white/40" />}
                    </button>
                </div>

                {/* Header */}
                <header className="relative px-12 pt-8 pb-4">
                    <div className="flex items-end justify-between">
                        <div className="flex items-center gap-6" style={{ animation: 'tvFadeUp 0.6s ease-out both' }}>
                            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' }}>
                                <img src={logoUrl || '/images/logo.png'} alt="" className="w-12 h-12 object-contain" />
                            </div>
                            <div>
                                <h1 className="font-display text-4xl text-white tracking-tight leading-none">{tournament?.name ?? ''}</h1>
                                <p className="text-base text-white/30 mt-1.5 font-medium">{tournament?.club}{dateStr && ` — ${dateStr}`}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6" style={{ animation: 'tvFadeUp 0.6s ease-out 0.1s both' }}>
                            <div className="text-right">
                                <div className="text-3xl font-black text-white/20 tabular-nums leading-none">{timeStr}</div>
                            </div>
                        </div>
                    </div>

                    {/* Active category indicator */}
                    <div className="mt-5 flex items-center gap-4" style={{ animation: 'tvFadeUp 0.6s ease-out 0.15s both' }}>
                        <div className="bg-white rounded-lg px-3 py-1.5">
                            <img src={sponsorLogoUrl || '/Eramet-Comilog-120 (1).png'} alt="Partenaire" className="h-6 object-contain" />
                        </div>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm font-bold text-white/60 uppercase tracking-[0.2em]">{activeCatName}{totalPages > 1 && ` (${currentPage + 1}/${totalPages})`}</span>
                        </div>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-white/20 via-white/10 to-transparent" />
                    </div>
                </header>

                {/* Category dots */}
                <div className="flex items-center justify-center gap-6 py-3">
                    <button onClick={() => { setActiveCategoryId(null); setCurrentPage(0); rotationRef.current = { catIdx: 0, page: 0 }; setIsPaused(true); setAnimKey((k) => k + 1); }} className="group flex flex-col items-center gap-1.5">
                        <div className={`rounded-full transition-all duration-500 ${!activeCategoryId ? 'w-3.5 h-3.5 bg-white shadow-lg shadow-white/20' : 'w-2.5 h-2.5 bg-white/20 group-hover:bg-white/40'}`} />
                        <span className={`text-[10px] font-semibold tracking-wider uppercase transition-colors ${!activeCategoryId ? 'text-white/70' : 'text-white/20 group-hover:text-white/40'}`}>Tous</span>
                    </button>
                    {activeCategories.map((cat) => {
                        const isActive = activeCategoryId === cat.id;
                        return (
                            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setCurrentPage(0); const idx = catIdsRef.current.indexOf(cat.id); rotationRef.current = { catIdx: idx >= 0 ? idx : 0, page: 0 }; setIsPaused(true); setAnimKey((k) => k + 1); }} className="group flex flex-col items-center gap-1.5">
                                <div className={`rounded-full transition-all duration-500 ${isActive ? `w-3.5 h-3.5 ${categoryDotColors[cat.name] ?? 'bg-white'} shadow-lg` : `w-2.5 h-2.5 ${categoryDotColors[cat.name] ?? 'bg-white'} opacity-30 group-hover:opacity-60`}`} />
                                <span className={`text-[10px] font-semibold tracking-wider uppercase transition-colors ${isActive ? 'text-white/70' : 'text-white/20 group-hover:text-white/40'}`}>{cat.short_name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Leaderboard */}
                <div className="flex-1 px-12 pb-2 overflow-hidden">
                    <div className="h-full flex flex-col" key={animKey}>
                        {/* Column headers */}
                        {(() => {
                            const headerGridCols = phaseScoresMap
                                ? `80px 1fr 70px ${Array.from({ length: currentPhase }, () => '56px').join(' ')} 70px 100px`
                                : '80px 1fr 70px 70px 70px 100px';
                            return (
                                <div className="grid items-center px-6 py-3 border-b border-white/[0.08]" style={{ gridTemplateColumns: headerGridCols }}>
                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] border-r border-white/[0.06] pr-3">Pos</span>
                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] border-r border-white/[0.06] px-3">Joueur</span>
                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] text-center border-r border-white/[0.06] px-2">Nat.</span>
                                    {phaseScoresMap ? (
                                        <>
                                            {Array.from({ length: currentPhase }, (_, i) => (
                                                <span key={i} className="text-[10px] font-bold text-amber-400/40 uppercase tracking-wider text-center border-r border-white/[0.06] px-1">R{i + 1}</span>
                                            ))}
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] text-center border-r border-white/[0.06] px-2">Trous</span>
                                    )}
                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] text-center border-r border-white/[0.06] px-2">Total</span>
                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] text-right pl-3">Score</span>
                                </div>
                            );
                        })()}

                        {/* Rows */}
                        <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {leaderboard.length === 0 && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
                                        <p className="text-lg text-white/20 font-medium">En attente des scores</p>
                                    </div>
                                </div>
                            )}
                            {leaderboard.map((entry, idx) => {
                                const isWithdrawn = !!entry.player.is_withdrawn;
                                const isCut = entry.player.cut_after_phase != null;
                                const position = (isWithdrawn || isCut) ? null : currentPage * perPage + idx + 1;
                                const isLeader = position === 1;
                                const isTop3 = position != null && position <= 3;

                                // Show cut line before first cut player
                                const prevEntry = idx > 0 ? leaderboard[idx - 1] : null;
                                const showCutLine = isCut && prevEntry && prevEntry.player.cut_after_phase == null && !prevEntry.player.is_withdrawn;

                                return (
                                    <div key={entry.player.id}>
                                    {showCutLine && (
                                        <div className="flex items-center gap-3 px-6 py-1.5">
                                            <div className="flex-1 h-[2px] bg-gradient-to-r from-red-500/50 to-transparent" />
                                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Ligne de cut</span>
                                            <div className="flex-1 h-[2px] bg-gradient-to-l from-red-500/50 to-transparent" />
                                        </div>
                                    )}
                                    <div
                                        className={`tv-row grid items-center px-6 py-3 border-b border-white/[0.04] transition-colors ${isWithdrawn ? 'opacity-40' : isCut ? 'opacity-40' : isLeader ? 'tv-leader-glow' : isTop3 ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'}`}
                                        style={{ gridTemplateColumns: phaseScoresMap ? `80px 1fr 70px ${Array.from({ length: currentPhase }, () => '56px').join(' ')} 70px 100px` : '80px 1fr 70px 70px 70px 100px', animationDelay: `${idx * 0.06}s` }}
                                    >
                                        {/* Position */}
                                        <div className="border-r border-white/[0.06] pr-3">
                                            {isWithdrawn ? (
                                                <span className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-sm font-black text-red-400">DIS</span>
                                            ) : isCut ? (
                                                <span className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-[10px] font-black text-red-400/60">CUT</span>
                                            ) : (
                                                <PositionBadge position={position!} />
                                            )}
                                        </div>

                                        {/* Player */}
                                        <div className="flex items-center gap-4 min-w-0 border-r border-white/[0.06] px-3">
                                            <div className={`w-1.5 h-10 rounded-full ${categoryDotColors[entry.categoryName] ?? 'bg-gray-500'}`} />
                                            <div className="min-w-0">
                                                <p className={`font-bold truncate leading-tight ${isWithdrawn ? 'text-lg text-white/40 line-through' : isLeader ? 'text-xl text-white' : 'text-lg text-white/90'}`}>{entry.player.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${categoryColors[entry.categoryName] ?? 'bg-white/10 text-white/50'}`}>{entry.categoryName}</span>
                                                    {isWithdrawn && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">DISQUALIFIÉ</span>}
                                                    {!isWithdrawn && entry.penaltyStrokes > 0 && (
                                                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">+{entry.penaltyStrokes} PEN</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nationality */}
                                        <div className="text-center border-r border-white/[0.06] px-2">
                                            <span className="text-2xl">{entry.player.nationality ? countryCodeToFlag(entry.player.nationality) : ''}</span>
                                        </div>

                                        {/* Phase scores / Holes */}
                                        {isWithdrawn ? (
                                            phaseScoresMap ? (
                                                <>{Array.from({ length: currentPhase }, (_, i) => <div key={i} className="text-center border-r border-white/[0.06] px-1"><span className="text-sm text-white/15">—</span></div>)}</>
                                            ) : (
                                                <div className="text-center border-r border-white/[0.06] px-2"><span className="text-sm text-white/15">—</span></div>
                                            )
                                        ) : phaseScoresMap ? (
                                            <>{Array.from({ length: currentPhase }, (_, i) => {
                                                const ps = phaseScoresMap?.[entry.player.id]?.[i + 1];
                                                if (!ps) return <div key={i} className="text-center border-r border-white/[0.06] px-1"><span className="text-sm text-white/15 tabular-nums">—</span></div>;
                                                const toPar = ps.strokes - ps.par;
                                                return (
                                                    <div key={i} className="text-center border-r border-white/[0.06] px-1">
                                                        <span className={`text-sm font-bold tabular-nums ${toPar < 0 ? 'text-emerald-400' : toPar === 0 ? 'text-white/50' : 'text-red-400'}`}>{ps.strokes}</span>
                                                    </div>
                                                );
                                            })}</>
                                        ) : (
                                            <div className="text-center border-r border-white/[0.06] px-2">
                                                <span className={`text-base tabular-nums ${entry.holesPlayed >= 18 * currentPhase ? 'text-emerald-400 font-bold' : 'text-white/40'}`}>
                                                    {entry.holesPlayed}<span className="text-white/20">/{18 * currentPhase}</span>
                                                </span>
                                            </div>
                                        )}

                                        {/* Total */}
                                        <div className="text-center border-r border-white/[0.06] px-2">
                                            <span className={`text-xl font-black tabular-nums ${isWithdrawn ? 'text-white/15' : 'text-white'}`}>{isWithdrawn ? '—' : entry.holesPlayed > 0 ? entry.totalStrokes : '—'}</span>
                                        </div>

                                        {/* Score to par */}
                                        <div className="flex flex-col items-end gap-0.5 pl-3">
                                            {isWithdrawn ? (
                                                <span className="text-lg text-white/20 font-bold">—</span>
                                            ) : (
                                                <ScoreBadge strokeToPar={entry.strokeToPar} holesPlayed={entry.holesPlayed} />
                                            )}
                                        </div>
                                    </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="px-12 py-3">
                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            </div>
                            <span className="text-xs text-white/30 font-medium tracking-wide">LIVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/15 tracking-wider">Made with Love by</span>
                            <img src="/logo jobs.jpeg" alt="JOBS" className="h-5 object-contain rounded-sm opacity-40" />
                        </div>
                    </div>
                </footer>
            </div>
            </div>
        </>
    );
}
