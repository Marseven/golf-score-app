import { useState, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Trophy, Download, Share2, FileText, Tv, Image, Loader2 } from 'lucide-react';
import { buildLeaderboard } from '@/Lib/scoring';
import { categoryColors } from '@/Lib/category-colors';
import { useRealtimeScores } from '@/Hooks/useRealtimeScores';
import type { Tournament, Player, Score, Hole, Category } from '@/types';

interface Props {
    tournament: Tournament | null;
    players: Player[];
    scores: Score[];
    holes: Hole[];
    categories: Category[];
}

type ScoringMode = 'stroke' | 'stableford';

function PositionBadge({ position }: { position: number }) {
    if (position === 1) return <span className="w-8 h-8 rounded-lg bg-amber-500 text-amber-950 flex items-center justify-center text-sm font-bold">1</span>;
    if (position === 2) return <span className="w-8 h-8 rounded-lg bg-slate-400 text-slate-950 flex items-center justify-center text-sm font-bold">2</span>;
    if (position === 3) return <span className="w-8 h-8 rounded-lg bg-amber-700 text-amber-100 flex items-center justify-center text-sm font-bold">3</span>;
    return <span className="w-8 h-8 rounded-lg bg-surface-hover text-muted-foreground flex items-center justify-center text-sm font-bold">{position}</span>;
}

export default function Classement({ tournament, players, scores, holes, categories }: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const { lastUpdate } = useRealtimeScores(tournament?.id);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [scoringMode, setScoringMode] = useState<ScoringMode>('stroke');
    const [capturing, setCapturing] = useState(false);
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
        categories
    );

    const buildWhatsAppText = () => {
        if (!tournament) return '';
        const header = `🏆 ${tournament.name}${tournament.club ? ` - ${tournament.club}` : ''}`;
        const sections = categories.map((cat) => {
            const catLeaderboard = buildLeaderboard(playersWithCategory, scores, holes, cat.id, 'stroke', categories);
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
                        <div className="hidden sm:flex items-center gap-2">
                            <a href={route('tv', tournament.id)} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover">
                                <Tv className="w-4 h-4" />Ecran TV
                            </a>
                            {user && (
                                <>
                                    <a href={route('export.pdf', tournament.id)} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover">
                                        <FileText className="w-4 h-4" />PDF
                                    </a>
                                    <a href={route('export.excel', tournament.id)} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover">
                                        <Download className="w-4 h-4" />Excel
                                    </a>
                                </>
                            )}
                            <button
                                onClick={handleShareImage}
                                disabled={capturing}
                                className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover disabled:opacity-50"
                            >
                                {capturing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Image className="w-4 h-4" />
                                )}
                                Partager
                            </button>
                            <button
                                onClick={() => {
                                    window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText())}`, '_blank');
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"
                            >
                                <Share2 className="w-4 h-4" />WhatsApp
                            </button>
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

                {/* Scoring Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                    <button onClick={() => setScoringMode('stroke')} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${scoringMode === 'stroke' ? 'bg-emerald-500 text-white' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>Stroke Play</button>
                    <button onClick={() => setScoringMode('stableford')} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${scoringMode === 'stableford' ? 'bg-amber-500 text-amber-950' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>Stableford</button>
                </div>

                {/* Leaderboard — captured for screenshot */}
                <div ref={leaderboardRef} className="space-y-2">
                    {leaderboard.map((entry, idx) => {
                        const position = idx + 1;
                        const isTop3 = position <= 3;
                        const scoreColor = entry.strokeToPar < 0 ? 'text-emerald-400' : entry.strokeToPar === 0 ? 'text-foreground' : 'text-red-400';
                        const sign = entry.strokeToPar > 0 ? '+' : '';

                        return (
                            <div key={entry.player.id} className={`glass-card flex items-center justify-between ${isTop3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : ''}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <PositionBadge position={position} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{entry.player.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[entry.categoryName] ?? 'bg-surface-hover text-foreground'}`}>
                                                {entry.categoryName}
                                            </span>
                                            {entry.playingHandicap > 0 && (
                                                <span className="text-xs text-muted-foreground font-mono">HC {entry.playingHandicap}</span>
                                            )}
                                            <span className="text-xs text-muted-foreground">{entry.holesPlayed}/18 trous</span>
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
                        );
                    })}
                </div>

                {/* Realtime indicator */}
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Temps reel &bull; {lastUpdate.toLocaleTimeString('fr-FR')}
                </div>
            </div>
        </PublicLayout>
    );
}
