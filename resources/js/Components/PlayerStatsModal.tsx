import { useState } from 'react';
import { X, BarChart3, Loader2 } from 'lucide-react';
import type { Player } from '@/types';

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

export default function PlayerStatsModal({ player, onClose }: { player: Player; onClose: () => void }) {
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
                            <p className="text-xs text-muted-foreground">Hdcp {player.handicap}{player.category?.name ? ` \u00b7 ${player.category.name}` : ''}</p>
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
