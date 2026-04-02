import { useState, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Trophy, Download, Share2, FileText, Tv, Image, Loader2, ChevronDown, QrCode, X, FileSpreadsheet, MoreHorizontal } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildLeaderboard } from '@/Lib/scoring';
import type { PenaltyData } from '@/Lib/scoring';
import { categoryColors } from '@/Lib/category-colors';
import { countryCodeToFlag } from '@/Lib/countries';
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
}

type ScoringMode = 'stroke' | 'stableford';

function PositionBadge({ position }: { position: number }) {
    if (position === 1) return <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🥇</span>;
    if (position === 2) return <span className="w-8 h-8 rounded-lg bg-slate-400/20 flex items-center justify-center text-lg">🥈</span>;
    if (position === 3) return <span className="w-8 h-8 rounded-lg bg-amber-700/20 flex items-center justify-center text-lg">🥉</span>;
    return <span className="w-8 h-8 rounded-lg bg-surface-hover text-muted-foreground flex items-center justify-center text-sm font-bold">{position}</span>;
}

export default function Classement({ tournament, players, scores, holes, categories, cuts, categoryPars, penalties }: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const { lastUpdate } = useRealtimeScores(tournament?.id);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [scoringMode, setScoringMode] = useState<ScoringMode>(
        tournament?.scoring_mode === 'stableford' ? 'stableford' : 'stroke'
    );
    const [activePhase, setActivePhase] = useState<number | undefined>(undefined);
    const [capturing, setCapturing] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const leaderboardRef = useRef<HTMLDivElement>(null);

    const playersWithCategory = players.map((p) => ({
        ...p,
        category: p.category ?? categories.find((c) => c.id === p.category_id) ?? null,
    }));

    const leaderboard = buildLeaderboard(
        playersWithCategory,
        scores,
        holes,
        activeCategoryId ?? undefined,
        scoringMode,
        categories,
        activePhase,
        tournament?.score_aggregation,
        categoryPars,
        penalties
    );

    const buildWhatsAppText = () => {
        if (!tournament) return '';
        const header = `🏆 ${tournament.name}${tournament.club ? ` - ${tournament.club}` : ''}`;
        const sections = categories.map((cat) => {
            const catLeaderboard = buildLeaderboard(playersWithCategory, scores, holes, cat.id, 'stroke', categories, undefined, undefined, categoryPars);
            const top3 = catLeaderboard.slice(0, 3).map((entry, i) => {
                const sign = entry.strokeToPar > 0 ? '+' : '';
                const score = entry.strokeToPar === 0 ? 'E' : `${sign}${entry.strokeToPar}`;
                return `${i + 1}. ${entry.player.name} (${score})`;
            }).join('\n');
            if (!top3) return '';
            return `📊 ${cat.name}\n${top3}`;
        }).filter(Boolean).join('\n\n');
        const classementUrl = route('classement', tournament.id);
        return `${header}\n\n${sections}\n\nClassement complet :\n${classementUrl}`;
    };

    const handleShareImage = async () => {
        if (!leaderboardRef.current || !tournament) return;
        setCapturing(true);
        try {
            const { default: html2canvas } = await import('html2canvas-pro');
            const canvas = await html2canvas(leaderboardRef.current, {
                backgroundColor: '#0f172a',
                scale: 2,
                useCORS: true,
            });

            // Try native share if available
            if (navigator.share && navigator.canShare?.({ files: [new File([], 'test.png', { type: 'image/png' })] })) {
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const file = new File([blob], `classement-${tournament.name}.png`, { type: 'image/png' });
                    try {
                        await navigator.share({
                            title: `Classement - ${tournament.name}`,
                            files: [file],
                        });
                    } catch {
                        // User cancelled or share failed, fallback to download
                        downloadCanvas(canvas);
                    }
                }, 'image/png');
            } else {
                // Fallback: download the image
                downloadCanvas(canvas);
            }
        } catch {
            // Fallback to text share
            window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText())}`, '_blank');
        } finally {
            setCapturing(false);
        }
    };

    const downloadCanvas = (canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `classement-${tournament!.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <PublicLayout>
            <Head title="Classement" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Classement en direct</h1>
                            <p className="text-sm text-muted-foreground">{tournament?.name ?? ''}</p>
                        </div>
                    </div>
                    {tournament && (
                        <div className="flex items-center gap-1.5">
                            <a
                                href={route('export.pdf', tournament.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5" />PDF
                            </a>
                            <button
                                onClick={() => {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText())}`, '_blank');
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground hover:bg-surface-hover transition-colors"
                            >
                                <Share2 className="w-3.5 h-3.5" />WhatsApp
                            </button>
                            <a
                                href={route('tv', tournament.id)}
                                target="_blank"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground hover:bg-surface-hover transition-colors"
                            >
                                <Tv className="w-3.5 h-3.5" />TV
                            </a>
                            <div className="relative">
                                <button
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    className="flex items-center justify-center w-8 h-8 bg-surface border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMoreMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                                            <a
                                                href={route('export.excel', tournament.id)}
                                                onClick={() => setShowMoreMenu(false)}
                                                className="flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-surface-hover transition-colors"
                                            >
                                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />Export Excel
                                            </a>
                                            <button
                                                onClick={() => { setShowQR(true); setShowMoreMenu(false); }}
                                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-foreground hover:bg-surface-hover transition-colors"
                                            >
                                                <QrCode className="w-3.5 h-3.5 text-primary" />QR Code
                                            </button>
                                            <button
                                                onClick={() => { handleShareImage(); setShowMoreMenu(false); }}
                                                disabled={capturing}
                                                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
                                            >
                                                {capturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                                                Partager image
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-2 px-2">
                    <button onClick={() => setActiveCategoryId(null)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!activeCategoryId ? 'bg-blue-500 text-white' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>
                        Tous ({players.length})
                    </button>
                    {categories.map((cat) => {
                        const count = players.filter((p) => p.category_id === cat.id).length;
                        return (
                            <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeCategoryId === cat.id ? `${categoryColors[cat.name] ?? 'bg-primary text-primary-foreground'}` : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>
                                    {cat.short_name} ({count})
                                </button>
                        );
                    })}
                </div>

                {/* Phase selector */}
                {tournament && tournament.phase_count > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-2 px-2">
                        <button
                            onClick={() => setActivePhase(undefined)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activePhase === undefined ? 'bg-violet-500 text-white' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                        >
                            {tournament.score_aggregation === 'cumulative' ? 'Total' : 'Toutes'}
                        </button>
                        {Array.from({ length: tournament.phase_count }, (_, i) => i + 1).map((phase) => (
                            <button
                                key={phase}
                                onClick={() => setActivePhase(phase)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activePhase === phase ? 'bg-violet-500 text-white' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                            >
                                Phase {phase}
                            </button>
                        ))}
                    </div>
                )}

                {/* Scoring Mode Toggle — only shown when tournament supports both modes */}
                {tournament?.scoring_mode === 'both' && (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <button onClick={() => setScoringMode('stroke')} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${scoringMode === 'stroke' ? 'bg-emerald-500 text-white' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>Stroke Play</button>
                        <button onClick={() => setScoringMode('stableford')} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${scoringMode === 'stableford' ? 'bg-amber-500 text-amber-950' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>Stableford</button>
                    </div>
                )}

                {/* Leaderboard — captured for screenshot */}
                <div ref={leaderboardRef} className="space-y-2">
                    {leaderboard.map((entry, idx) => {
                        const position = idx + 1;
                        const isTop3 = position <= 3;
                        const isCut = entry.player.cut_after_phase != null;
                        const scoreColor = entry.strokeToPar < 0 ? 'text-emerald-400' : entry.strokeToPar === 0 ? 'text-foreground' : 'text-red-400';
                        const sign = entry.strokeToPar > 0 ? '+' : '';

                        // Determine if a cut line should be drawn after this entry
                        const currentCategoryCut = activeCategoryId
                            ? cuts?.find((c) => c.category_id === activeCategoryId && c.after_phase === (activePhase ?? 1) && !c.applied_at)
                            : null;
                        const showCutLine = currentCategoryCut && !isCut && position === currentCategoryCut.qualified_count;

                        return (
                            <div key={entry.player.id}>
                                <div className={`glass-card flex items-center justify-between ${isCut ? 'opacity-50' : ''} ${isTop3 && !isCut ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : ''}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <PositionBadge position={position} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            {entry.player.nationality && <span className="text-base leading-none">{countryCodeToFlag(entry.player.nationality)}</span>}
                                            <p className="text-sm font-semibold text-foreground truncate">{entry.player.name}</p>
                                            {isCut && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">CUT P{entry.player.cut_after_phase}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[entry.categoryName] ?? 'bg-surface-hover text-foreground'}`}>
                                                {entry.categoryName}
                                            </span>
                                            {entry.playingHandicap > 0 && (
                                                <span className="text-xs text-muted-foreground font-mono">HC {entry.playingHandicap}</span>
                                            )}
                                            <span className="text-xs text-muted-foreground">{entry.holesPlayed} trous</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {scoringMode === 'stableford' ? (
                                        <>
                                            <p className="text-lg font-bold text-amber-400">{entry.netStablefordPoints}</p>
                                            <p className="text-xs text-muted-foreground">{entry.netStablefordPoints !== entry.stablefordPoints ? `brut ${entry.stablefordPoints}` : 'points'}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className={`text-lg font-bold ${scoreColor}`}>{entry.strokeToPar === 0 ? 'E' : `${sign}${entry.strokeToPar}`}</p>
                                            <p className="text-xs text-muted-foreground">{entry.totalStrokes} coups</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            {showCutLine && (
                                <div className="flex items-center gap-2 my-1">
                                    <div className="flex-1 h-0.5 bg-red-500/50" />
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Ligne de cut</span>
                                    <div className="flex-1 h-0.5 bg-red-500/50" />
                                </div>
                            )}
                            </div>
                        );
                    })}
                </div>

                {/* Realtime indicator */}
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Temps reel &bull; {lastUpdate.toLocaleTimeString('fr-FR')}
                </div>
            </div>
            {/* QR Code Modal */}
            {showQR && tournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowQR(false)} />
                    <div className="relative w-full max-w-sm bg-sidebar border border-border rounded-2xl shadow-xl p-6">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                <QrCode className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">Classement en ligne</h3>
                            <p className="text-sm text-muted-foreground mb-6">{tournament.name}</p>
                            <div className="bg-white p-4 rounded-xl mb-4">
                                <QRCodeSVG
                                    value={route('classement', tournament.id)}
                                    size={200}
                                    level="M"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 break-all">{route('classement', tournament.id)}</p>
                            <div className="flex gap-2 w-full">
                                <a
                                    href={route('export.pdf', tournament.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />PDF
                                </a>
                                <a
                                    href={route('export.excel', tournament.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />Excel
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
