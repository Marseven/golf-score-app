import { useState, useRef, useMemo } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Settings, BarChart3, Trophy, Users, Target, MapPin, Save, Plus, Trash2, Pencil, X, Check, RefreshCw, Clock, Copy, UserPlus, Send, FileText, FileSpreadsheet, QrCode, Flag, Tag, UserCheck, CreditCard, LinkIcon, Download, Hash, Upload, Scissors, ClipboardList, AlertTriangle } from 'lucide-react';
import type { Tournament, Category, Player, Group, Hole, Score, Payment, Course, Cut, CategoryPar, PageProps, Penalty } from '@/types';
import { categoryColors, categoryDotColors } from '@/Lib/category-colors';
import { countryCodeToFlag, countries } from '@/Lib/countries';
import DataTable from '@/Components/DataTable';
import { useConfirm } from '@/Components/ConfirmDialog';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

function downloadCsvTemplate(filename: string, headers: string[], sampleRows: string[][]) {
    const csv = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

interface MarkerUser {
    id: string;
    name: string;
    email: string;
}

interface Props {
    tournament: Tournament;
    courses: Course[];
    categories: Category[];
    players: Player[];
    groups: Group[];
    holes: Hole[];
    scores: Score[];
    cuts: Cut[];
    registrations: Player[];
    payments: Payment[];
    markers: MarkerUser[];
    categoryPars: CategoryPar[];
    penalties: Penalty[];
}

interface TabDef {
    id: string;
    label: string;
    icon: any;
    adminOnly?: boolean;
}

const allTabs: TabDef[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'tournament', label: 'Tournoi', icon: Trophy },
    { id: 'categories', label: 'Catégories', icon: Tag },
    { id: 'players', label: 'Joueurs', icon: Users },
    { id: 'groups', label: 'Groupes', icon: Target },
    { id: 'course', label: 'Parcours', icon: MapPin },
    { id: 'scores', label: 'Scores', icon: ClipboardList },
    { id: 'registrations', label: 'Inscriptions', icon: UserCheck, adminOnly: true },
    { id: 'payments', label: 'Paiements', icon: CreditCard, adminOnly: true },
];

// --- Dashboard Tab ---
function DashboardTab({ tournament, players, groups, scores }: { tournament: Tournament; players: Player[]; groups: Group[]; scores: Score[] }) {
    const [showQRModal, setShowQRModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const syncedCount = scores.filter((s) => s.synced).length;
    const totalHoles = players.length * 18;
    const progress = totalHoles > 0 ? Math.round((scores.length / totalHoles) * 100) : 0;

    const stats = [
        { label: 'Joueurs inscrits', value: String(players.length), icon: Users, color: 'bg-blue-500/20 text-blue-400' },
        { label: 'Groupes', value: String(groups.length), icon: Target, color: 'bg-emerald-500/20 text-emerald-400' },
        { label: 'Progression', value: `${progress}%`, icon: Flag, color: 'bg-amber-500/20 text-amber-400' },
        { label: 'Scores sync.', value: String(syncedCount), icon: RefreshCw, color: 'bg-violet-500/20 text-violet-400' },
    ];

    const handleQuickAction = (label: string) => {
        switch (label) {
            case 'Export PDF':
                window.location.href = route('export.pdf', tournament.id);
                break;
            case 'Export Excel':
                window.location.href = route('export.excel', tournament.id);
                break;
            case 'WhatsApp': {
                const classementUrl = route('classement', tournament.id);
                const text = `${tournament.name}${tournament.club ? ` - ${tournament.club}` : ''}\n\nClassement en ligne :\n${classementUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                break;
            }
            case 'QR Codes':
                setShowQRModal(true);
                break;
        }
    };

    const quickActions = [
        { label: 'WhatsApp', desc: 'Diffuser résultats', icon: Send, color: 'text-emerald-400' },
        { label: 'Export PDF', desc: 'Classement officiel', icon: FileText, color: 'text-red-400' },
        { label: 'Export Excel', desc: 'Données complètes', icon: FileSpreadsheet, color: 'text-green-400' },
        { label: 'QR Codes', desc: 'Accès public', icon: QrCode, color: 'text-blue-400' },
    ];

    const classementUrl = route('classement', tournament.id);

    const downloadClassementQR = () => {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;

        const qrSize = 256;
        const padding = 40;
        const width = qrSize + padding * 2;
        const headerHeight = 80;
        const footerHeight = 40;
        const height = headerHeight + qrSize + footerHeight + padding;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = width;
        outCanvas.height = height;
        const ctx = outCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tournament.name, width / 2, padding + 25);

        ctx.fillStyle = '#666666';
        ctx.font = '13px Arial, sans-serif';
        ctx.fillText('Classement en ligne', width / 2, padding + 50);

        ctx.drawImage(canvas, padding, headerHeight, qrSize, qrSize);

        ctx.fillStyle = '#999999';
        ctx.font = '9px Arial, sans-serif';
        const displayUrl = classementUrl.length > 60 ? classementUrl.substring(0, 57) + '...' : classementUrl;
        ctx.fillText(displayUrl, width / 2, headerHeight + qrSize + 20);

        const link = document.createElement('a');
        link.download = `qr-classement-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = outCanvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="glass-card flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions rapides</h3>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <button key={action.label} onClick={() => handleQuickAction(action.label)} className="glass-card hover:bg-surface-hover transition-colors cursor-pointer text-left">
                            <action.icon className={`w-6 h-6 ${action.color} mb-3`} />
                            <p className="text-sm font-semibold text-foreground">{action.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowQRModal(false)} />
                    <div className="relative w-full max-w-sm mx-4 bg-sidebar border border-border rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <QrCode className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">QR Code Classement</h2>
                            </div>
                            <button onClick={() => setShowQRModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-4">
                            <div className="bg-white p-4 rounded-xl">
                                <QRCodeCanvas
                                    ref={qrCanvasRef}
                                    value={classementUrl}
                                    size={200}
                                    level="M"
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono break-all text-center max-w-[260px]">{classementUrl}</p>
                            <button
                                onClick={downloadClassementQR}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger PNG
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset scores */}
            {scores.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Réinitialiser le tournoi</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Supprimer tous les scores, pénalités et cuts ({scores.length} scores)</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-semibold transition-colors border border-red-500/20"
                    >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />Réinitialiser
                    </button>
                </div>
            )}

            {/* Reset confirmation modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
                    <div className="relative w-full max-w-sm bg-sidebar border border-border rounded-2xl shadow-xl p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Réinitialiser le tournoi ?</h3>
                            <p className="text-sm text-muted-foreground mb-6">Cette action supprimera <strong>{scores.length} scores</strong>, toutes les pénalités et les cuts appliqués. Cette action est irréversible.</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.delete(route('scores.reset', tournament.id), { preserveScroll: true });
                                        setShowResetConfirm(false);
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                                >
                                    Tout supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Tournament Tab ---
function formatDateForInput(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return dateStr.substring(0, 10);
}

function TournamentTab({ tournament, players, categories, cuts }: { tournament: Tournament; players: Player[]; categories: Category[]; cuts: Cut[] }) {
    const [copied, setCopied] = useState(false);
    const [pinCopied, setPinCopied] = useState(false);
    const { confirm, confirmDialog } = useConfirm();
    const [defaultCut, setDefaultCut] = useState<number>(() => {
        const firstCut = cuts?.find((c) => c.after_phase === 1 && c.qualified_count);
        return firstCut?.qualified_count ?? 10;
    });
    // Key: "phase:catId" → qualified_count
    const [cutCounts, setCutCounts] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        const maxPhase = Math.max(1, tournament.phase_count - 1);
        for (let phase = 1; phase <= maxPhase; phase++) {
            (categories ?? []).forEach((cat) => {
                const existingCut = cuts?.find((c) => c.category_id === cat.id && c.after_phase === phase);
                initial[`${phase}:${cat.id}`] = existingCut?.qualified_count ?? defaultCut;
            });
        }
        return initial;
    });
    const form = useForm({
        name: tournament.name,
        start_date: formatDateForInput(tournament.start_date),
        end_date: formatDateForInput(tournament.end_date),
        club: tournament.club,
        status: tournament.status,
        scoring_mode: tournament.scoring_mode,
        phase_count: tournament.phase_count,
        score_aggregation: tournament.score_aggregation,
        rules: tournament.rules || '',
        registration_open: tournament.registration_open,
        registration_currency: tournament.registration_currency,
        caddie_master_pin: tournament.caddie_master_pin || '',
    });

    const scoringModes = [
        { id: 'stroke_play', label: 'Stroke Play', desc: 'Total des coups sur le parcours' },
        { id: 'stableford', label: 'Stableford', desc: 'Points par trou selon le par' },
        { id: 'both', label: 'Les deux', desc: 'Afficher Stroke Play et Stableford' },
    ];

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('tournaments.update', tournament.id));
    };

    const copyRegistrationLink = () => {
        const link = `${route('inscription.create', tournament.id)}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Registration toggle banner */}
            <div className={`rounded-2xl p-4 sm:p-6 border ${form.data.registration_open ? 'border-emerald-500/20' : 'border-amber-500/20'}`} style={{ background: 'hsl(var(--glass-bg))' }}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${form.data.registration_open ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                        <UserPlus className={`w-5 h-5 ${form.data.registration_open ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {form.data.registration_open ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {form.data.registration_open ? 'Les joueurs peuvent s\'inscrire en ligne' : 'Les inscriptions en ligne sont désactivées'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => form.setData('registration_open', !form.data.registration_open)}
                        className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${form.data.registration_open ? 'bg-primary' : 'bg-surface-hover border border-border'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${form.data.registration_open ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Informations</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Nom du tournoi</label>
                            <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Date de début</label>
                                <input type="date" value={form.data.start_date} onChange={(e) => form.setData('start_date', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Date de fin</label>
                                <input type="date" value={form.data.end_date} onChange={(e) => form.setData('end_date', e.target.value)} min={form.data.start_date} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Statut</label>
                                <select value={form.data.status} onChange={(e) => form.setData('status', e.target.value as any)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors appearance-none">
                                    <option value="draft">Brouillon</option>
                                    <option value="published">Publié</option>
                                    <option value="active">En cours</option>
                                    <option value="finished">Terminé</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Club</label>
                            <input type="text" value={form.data.club} onChange={(e) => form.setData('club', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
                        </div>
                    </div>
                </div>
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Mode de calcul</h3>
                    <div className="space-y-3">
                        {scoringModes.map((mode) => (
                            <button type="button" key={mode.id} onClick={() => form.setData('scoring_mode', mode.id as any)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${form.data.scoring_mode === mode.id ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover'}`}>
                                <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Inscription en ligne</h3>
                        <p className="text-xs text-muted-foreground">Paramètres d'inscription publique</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-muted-foreground block mb-1.5">Devise</label>
                        <select
                            value={form.data.registration_currency}
                            onChange={(e) => form.setData('registration_currency', e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors appearance-none"
                        >
                            <option value="XAF">XAF (Franc CFA)</option>
                            <option value="XOF">XOF (Franc CFA BCEAO)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="USD">USD (Dollar US)</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1.5">Les frais d'inscription sont configurés par catégorie dans l'onglet Catégories.</p>
                    </div>
                    {form.data.registration_open && (
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Lien d'inscription</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${route('inscription.create', tournament.id)}`}
                                    className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={copyRegistrationLink}
                                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copié !' : 'Copier'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phase configuration */}
            {tournament.phase_count > 1 && (
                <div className="glass-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Flag className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Phases</h3>
                            <p className="text-xs text-muted-foreground">{tournament.phase_count} phases — Scores {tournament.score_aggregation === 'cumulative' ? 'cumulatifs' : 'séparés'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cut section — unified per category */}
            <div className="glass-card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Scissors className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Cut par catégorie</h3>
                        <p className="text-xs text-muted-foreground">Définir la phase et le nombre de qualifiés pour chaque catégorie</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {/* Default cut value */}
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-foreground">Limite par défaut</label>
                            <p className="text-[10px] text-muted-foreground">Nombre de qualifiés appliqué à toutes les catégories</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={defaultCut}
                                onChange={(e) => setDefaultCut(Math.max(1, Number(e.target.value)))}
                                min={1}
                                className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-center focus:border-primary focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setCutCounts((prev) => {
                                        const updated = { ...prev };
                                        (categories ?? []).forEach((cat) => {
                                            const catMaxPhases = cat.max_phases ?? tournament.phase_count;
                                            for (let p = 1; p < catMaxPhases; p++) {
                                                updated[`${p}:${cat.id}`] = defaultCut;
                                            }
                                        });
                                        return updated;
                                    });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors whitespace-nowrap"
                            >
                                Appliquer à tous
                            </button>
                        </div>
                    </div>

                    {/* Per-category cut config */}
                    {(categories ?? []).map((cat) => {
                        const catMaxPhases = cat.max_phases ?? tournament.phase_count;
                        const catPlayers = players.filter((p) => p.category_id === cat.id).length;
                        const catCuts = cuts.filter((c) => c.category_id === cat.id);

                        return (
                            <div key={cat.id} className="rounded-xl border border-border overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-surface/50">
                                    <div className={`w-3 h-3 rounded-full ${categoryDotColors[cat.name] ?? 'bg-gray-500'}`} />
                                    <span className="text-sm font-bold text-foreground">{cat.name}</span>
                                    <span className="text-xs text-muted-foreground">({catPlayers} joueurs)</span>
                                    <span className="ml-auto px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-bold">{catMaxPhases} tour{catMaxPhases > 1 ? 's' : ''}</span>
                                </div>
                                {catMaxPhases <= 1 ? (
                                    <div className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs text-muted-foreground">Qualifiés :</label>
                                            <input
                                                type="number"
                                                value={cutCounts[`1:${cat.id}`] ?? defaultCut}
                                                onChange={(e) => setCutCounts((prev) => ({ ...prev, [`1:${cat.id}`]: Math.max(1, Number(e.target.value)) }))}
                                                min={1}
                                                className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-center focus:border-primary focus:outline-none"
                                            />
                                            {(() => { const c = catCuts.find((c) => c.after_phase === 1); return c?.applied_at ? <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">Appliqué</span> : null; })()}
                                            <div className="ml-auto flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const existing = catCuts.find((c) => c.after_phase === 1);
                                                        if (existing?.applied_at) {
                                                            router.post(route('tournaments.resetPhaseCut', tournament.id), { after_phase: 1 }, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    router.post(route('tournaments.applyPhaseCut', tournament.id), { after_phase: 1, cuts: [{ category_id: cat.id, qualified_count: cutCounts[`1:${cat.id}`] ?? defaultCut }] }, { preserveScroll: true });
                                                                },
                                                            });
                                                        } else {
                                                            router.post(route('tournaments.applyPhaseCut', tournament.id), { after_phase: 1, cuts: [{ category_id: cat.id, qualified_count: cutCounts[`1:${cat.id}`] ?? defaultCut }] }, { preserveScroll: true });
                                                        }
                                                    }}
                                                    disabled={false}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                >
                                                    <Scissors className="w-3 h-3 inline mr-1" />Appliquer
                                                </button>
                                                {catCuts.find((c) => c.after_phase === 1)?.applied_at && (
                                                    <button type="button" onClick={() => router.post(route('tournaments.resetPhaseCut', tournament.id), { after_phase: 1 }, { preserveScroll: true })} className="px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border text-muted-foreground rounded-lg text-xs font-medium transition-colors">
                                                        <RefreshCw className="w-3 h-3 inline mr-1" />Reset
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {Array.from({ length: catMaxPhases - 1 }, (_, i) => i + 1).map((afterPhase) => {
                                            const existingCut = catCuts.find((c) => c.after_phase === afterPhase);
                                            return (
                                                <div key={afterPhase} className="flex items-center gap-3 px-4 py-2.5">
                                                    <span className="text-xs font-bold text-muted-foreground min-w-[80px]">Après P{afterPhase}</span>
                                                    <label className="text-xs text-muted-foreground">Qualifiés :</label>
                                                    <input
                                                        type="number"
                                                        value={cutCounts[`${afterPhase}:${cat.id}`] ?? defaultCut}
                                                        onChange={(e) => setCutCounts((prev) => ({ ...prev, [`${afterPhase}:${cat.id}`]: Math.max(1, Number(e.target.value)) }))}
                                                        min={1}
                                                        className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-center focus:border-primary focus:outline-none"
                                                    />
                                                    {existingCut?.applied_at && <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">Appliqué</span>}
                                                    <div className="ml-auto flex gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (existingCut?.applied_at) {
                                                                    router.post(route('tournaments.resetPhaseCut', tournament.id), { after_phase: afterPhase }, {
                                                                        preserveScroll: true,
                                                                        onSuccess: () => {
                                                                            router.post(route('tournaments.applyPhaseCut', tournament.id), { after_phase: afterPhase, cuts: [{ category_id: cat.id, qualified_count: cutCounts[`${afterPhase}:${cat.id}`] ?? defaultCut }] }, { preserveScroll: true });
                                                                        },
                                                                    });
                                                                } else {
                                                                    router.post(route('tournaments.applyPhaseCut', tournament.id), { after_phase: afterPhase, cuts: [{ category_id: cat.id, qualified_count: cutCounts[`${afterPhase}:${cat.id}`] ?? defaultCut }] }, { preserveScroll: true });
                                                                }
                                                            }}
                                                            disabled={false}
                                                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            <Scissors className="w-3 h-3 inline mr-0.5" />Appliquer
                                                        </button>
                                                        {existingCut?.applied_at && (
                                                            <button type="button" onClick={() => router.post(route('tournaments.resetPhaseCut', tournament.id), { after_phase: afterPhase }, { preserveScroll: true })} className="px-2.5 py-1 bg-surface hover:bg-surface-hover border border-border text-muted-foreground rounded-lg text-[10px] font-medium transition-colors">
                                                                <RefreshCw className="w-3 h-3 inline mr-0.5" />Reset
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Caddie Master section */}
            <div className="glass-card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Caddie Master</h3>
                        <p className="text-xs text-muted-foreground">PIN d'accès pour la saisie multi-groupes</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-muted-foreground block mb-1.5">PIN Caddie Master</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={form.data.caddie_master_pin}
                                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground font-mono text-lg tracking-[0.3em] text-center focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(form.data.caddie_master_pin);
                                    setPinCopied(true);
                                    setTimeout(() => setPinCopied(false), 2000);
                                }}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                {pinCopied ? 'Copié !' : 'Copier'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const newPin = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
                                    form.setData('caddie_master_pin', newPin);
                                    router.put(route('tournaments.update', tournament.id), {
                                        ...form.data,
                                        caddie_master_pin: newPin,
                                    }, { preserveScroll: true });
                                }}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border text-foreground text-sm font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Régénérer
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-muted-foreground block mb-1.5">Lien Caddie Master</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={route('caddie-master.login')}
                                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground focus:outline-none"
                            />
                            <a
                                href={route('caddie-master.login')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border text-foreground text-sm font-medium transition-colors"
                            >
                                <LinkIcon className="w-4 h-4" />
                                Ouvrir
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={form.processing} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {form.processing ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
            </div>
            {confirmDialog}
        </form>
    );
}

// --- Categories Tab ---
function CategoriesTab({ tournament, categories, courses }: { tournament: Tournament; categories: Category[]; courses: Course[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const form = useForm({ name: '', short_name: '', color: 'blue', registration_fee: 0, course_id: courses[0]?.id ?? '', handicap_coefficient: 1.0, max_phases: null as number | null });
    const { confirm, confirmDialog } = useConfirm();

    const colorOptions = ['blue', 'pink', 'emerald', 'violet', 'amber', 'red', 'cyan', 'orange'];

    const resetForm = () => { form.reset(); setShowForm(false); setEditingId(null); };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        form.setData({ name: cat.name, short_name: cat.short_name, color: cat.color, registration_fee: cat.registration_fee ?? 0, course_id: cat.course_id ?? courses[0]?.id ?? '', handicap_coefficient: cat.handicap_coefficient ?? 1.0, max_phases: cat.max_phases ?? null });
        setShowForm(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(route('categories.update', [tournament.id, editingId]), { onSuccess: resetForm });
        } else {
            form.post(route('categories.store', tournament.id), { onSuccess: resetForm });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const ok = await confirm({
            title: 'Supprimer la catégorie',
            message: `Supprimer la catégorie "${name}" ?`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('categories.destroy', [tournament.id, id]));
    };

    const formUI = (showForm || editingId) && (
        <form onSubmit={handleSave} className="glass-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Nom</label>
                    <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Ex: Pro H" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Abréviation</label>
                    <input type="text" value={form.data.short_name} onChange={(e) => form.setData('short_name', e.target.value)} placeholder="Ex: PH" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Frais d'inscription</label>
                    <input type="number" value={form.data.registration_fee} onChange={(e) => form.setData('registration_fee', Number(e.target.value))} step={100} min={0} placeholder="0" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Parcours</label>
                    <select value={form.data.course_id} onChange={(e) => form.setData('course_id', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Coefficient handicap</label>
                    <input type="number" value={form.data.handicap_coefficient} onChange={(e) => form.setData('handicap_coefficient', Number(e.target.value))} step={0.01} min={0} max={2} placeholder="1.00" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                    <p className="text-[10px] text-muted-foreground mt-1">Ex: 0.85 (Pro), 1.0 (Amateur)</p>
                </div>
                {tournament.phase_count > 1 && (
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">Nombre de phases</label>
                        <div className="flex gap-1">
                            {Array.from({ length: tournament.phase_count }, (_, i) => i + 1).map((n) => (
                                <button key={n} type="button" onClick={() => form.setData('max_phases', n)} className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${(form.data.max_phases ?? tournament.phase_count) === n ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-muted-foreground hover:bg-surface-hover'}`}>{n}</button>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Nombre de tours que cette catégorie joue</p>
                    </div>
                )}
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Couleur</label>
                    <div className="flex gap-2 flex-wrap">
                        {colorOptions.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => form.setData('color', c)}
                                className={`w-8 h-8 rounded-lg bg-${c}-500 transition-all ${form.data.color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'}`}
                                title={c}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"><X className="w-4 h-4" />Annuler</button>
                <button type="submit" disabled={form.processing || !form.data.name.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90"><Check className="w-4 h-4" />{form.processing ? '...' : 'Enregistrer'}</button>
            </div>
        </form>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25">
                    <Plus className="w-4 h-4" />Ajouter
                </button>
            </div>
            {formUI}
            <div className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Nom</th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Abréviation</th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Parcours</th>
                                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Coeff. HC</th>
                                {tournament.phase_count > 1 && <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Phases</th>}
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Couleur</th>
                                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Frais</th>
                                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {categories.map((cat) => {
                                const courseName = courses.find((c) => c.id === cat.course_id)?.name ?? '—';
                                return (
                                    <tr key={cat.id} className="hover:bg-surface transition-colors">
                                        <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{cat.name}</span></td>
                                        <td className="px-6 py-4"><span className="text-sm text-foreground">{cat.short_name}</span></td>
                                        <td className="px-6 py-4"><span className="text-xs text-muted-foreground">{courseName}</span></td>
                                        <td className="px-6 py-4 text-center"><span className="text-sm font-mono text-foreground">{cat.handicap_coefficient ?? 1.0}</span></td>
                                        {tournament.phase_count > 1 && <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-xs font-bold">{cat.max_phases ?? tournament.phase_count} tour{(cat.max_phases ?? tournament.phase_count) > 1 ? 's' : ''}</span></td>}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full ${categoryDotColors[cat.name] ?? 'bg-gray-500'}`} />
                                                <span className="text-xs text-muted-foreground">{cat.color}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-medium text-foreground">{cat.registration_fee > 0 ? `${cat.registration_fee} ${tournament.registration_currency}` : '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => startEdit(cat)} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {confirmDialog}
        </div>
    );
}

// --- Players Tab ---
function PlayersTab({ tournament, players, categories, groups }: { tournament: Tournament; players: Player[]; categories: Category[]; groups: Group[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const { confirm, confirmDialog } = useConfirm();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const form = useForm({ name: '', handicap: 0, category_id: '', group_id: '', email: '', phone: '', nationality: '' });

    const resetForm = () => { form.reset(); setShowForm(false); setEditingId(null); };

    const startEdit = (player: Player) => {
        setEditingId(player.id);
        form.setData({ name: player.name, handicap: player.handicap, category_id: player.category_id ?? '', group_id: player.group_id ?? '', email: player.email ?? '', phone: player.phone ?? '', nationality: player.nationality ?? '' });
        setShowForm(false);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(route('players.update', [tournament.id, editingId]), { onSuccess: resetForm });
        } else {
            form.post(route('players.store', tournament.id), { onSuccess: resetForm });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const ok = await confirm({
            title: 'Supprimer le joueur',
            message: `Supprimer le joueur "${name}" ?`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('players.destroy', [tournament.id, id]));
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        router.post(route('players.import', tournament.id), { file }, {
            forceFormData: true,
            onFinish: () => {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const formUI = (showForm || editingId) && (
        <form onSubmit={handleSave} className="glass-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{editingId ? 'Modifier le joueur' : 'Nouveau joueur'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Nom</label>
                    <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Nom du joueur" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Handicap</label>
                    <input type="number" value={form.data.handicap} onChange={(e) => form.setData('handicap', Number(e.target.value))} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Catégorie</label>
                    <select value={form.data.category_id} onChange={(e) => form.setData('category_id', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                        <option value="">— Aucune —</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Groupe</label>
                    <select value={form.data.group_id} onChange={(e) => form.setData('group_id', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                        <option value="">— Aucun —</option>
                        {groups.map((g) => <option key={g.id} value={g.id}>{g.code} ({g.tee_time})</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Nationalité</label>
                    <select value={form.data.nationality} onChange={(e) => form.setData('nationality', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                        <option value="">— Aucune —</option>
                        {countries.map(([code, name]) => <option key={code} value={code}>{countryCodeToFlag(code)} {name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"><X className="w-4 h-4" />Annuler</button>
                <button type="submit" disabled={form.processing || !form.data.name.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90"><Check className="w-4 h-4" />{form.processing ? '...' : 'Enregistrer'}</button>
            </div>
        </form>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25">
                    <UserPlus className="w-4 h-4" />Ajouter
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover disabled:opacity-50">
                    <Upload className="w-4 h-4" />{importing ? 'Import...' : 'Importer CSV'}
                </button>
                <button onClick={() => downloadCsvTemplate('template-joueurs.csv', ['name', 'handicap', 'category', 'email', 'phone'], [['Jean Dupont', '12', 'Pro H', 'jean@email.com', '077123456']])} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover">
                    <Download className="w-4 h-4" />Template
                </button>
            </div>
            {formUI}
            <DataTable data={players} searchKeys={['name']} searchPlaceholder="Rechercher un joueur...">
                {(paginatedPlayers) => (
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Joueur</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Catégorie</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">HC</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Groupe</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedPlayers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground italic">Aucun résultat</td>
                                        </tr>
                                    ) : paginatedPlayers.map((player) => (
                                        <tr key={player.id} className="hover:bg-surface transition-colors">
                                            <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{player.nationality ? countryCodeToFlag(player.nationality) + ' ' : ''}{player.name}</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${categoryColors[player.category?.name ?? ''] ?? 'bg-surface-hover text-foreground'}`}>
                                                    {player.category?.name ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-sm text-foreground">{player.handicap}</span></td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 rounded-md bg-surface-hover text-xs font-mono text-foreground">{player.group?.code ?? '—'}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => startEdit(player)} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(player.id, player.name)} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </DataTable>
            {confirmDialog}
        </div>
    );
}

// --- Groups Tab (enriched with marker, PIN, QR code, phase filtering) ---
function GroupsTab({ tournament, groups, markers, players, categories, courses }: { tournament: Tournament; groups: Group[]; markers: MarkerUser[]; players: Player[]; categories: Category[]; courses: Course[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showQR, setShowQR] = useState<string | null>(null);
    const [showMarkerForm, setShowMarkerForm] = useState(false);
    const [activePhase, setActivePhase] = useState(1);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [bulkMarkerIds, setBulkMarkerIds] = useState<string[]>([]);
    const [bulkCourseId, setBulkCourseId] = useState('');
    const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
    const { confirm, confirmDialog } = useConfirm();
    const form = useForm({ tee_time: '08:00', tee_date: '', phase: 1, category_id: '' as string, course_id: '' as string, marker_ids: [] as string[], marker_phone: '', player_ids: [] as string[] });
    const markerForm = useForm({ name: '', email: '', password: '', hole_start: 1, hole_end: 18 });

    const resetForm = () => { form.reset(); form.setData('phase', activePhase); setShowForm(false); setEditingId(null); };

    const handleCreateMarker = (e: React.FormEvent) => {
        e.preventDefault();
        markerForm.post(route('markers.store', tournament.id), {
            onSuccess: () => { markerForm.reset(); setShowMarkerForm(false); },
        });
    };

    // Players not assigned to any group, or assigned to the group being edited.
    // If category is selected, filter by category. If phase > 1, filter out cut players.
    const availablePlayers = players.filter((p) => {
        if (p.group_id && p.group_id !== editingId) return false;
        if (form.data.category_id && p.category_id !== form.data.category_id) return false;
        const phase = form.data.phase;
        if (phase > 1 && p.cut_after_phase != null && p.cut_after_phase < phase) return false;
        return true;
    });

    // All markers are available (a marker can handle multiple groups)
    const availableMarkers = markers;

    const startEdit = (group: Group) => {
        setEditingId(group.id);
        form.setData({
            tee_time: group.tee_time,
            tee_date: group.tee_date ? group.tee_date.substring(0, 10) : '',
            phase: group.phase ?? 1,
            category_id: group.category_id ?? '',
            course_id: group.course_id ?? '',
            marker_ids: group.markers?.map((m) => m.id) ?? (group.marker_id ? [group.marker_id] : []),
            marker_phone: group.marker_phone ?? '',
            player_ids: group.players?.map((p) => p.id) ?? [],
        });
        setShowForm(false);
    };

    const togglePlayer = (playerId: string) => {
        const current = form.data.player_ids;
        if (current.includes(playerId)) {
            form.setData('player_ids', current.filter((id) => id !== playerId));
        } else {
            form.setData('player_ids', [...current, playerId]);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(route('groups.update', [tournament.id, editingId]), { onSuccess: resetForm });
        } else {
            form.post(route('groups.store', tournament.id), { onSuccess: resetForm });
        }
    };

    const handleDelete = async (id: string, code: string) => {
        const ok = await confirm({
            title: 'Supprimer le groupe',
            message: `Supprimer le groupe "${code}" ?`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('groups.destroy', [tournament.id, id]));
    };

    const copyMarkerLink = (token: string) => {
        navigator.clipboard.writeText(route('marqueur.token', token));
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const getMarkerUrl = (token: string) => {
        return route('marqueur.token', token);
    };

    const downloadQR = (group: Group) => {
        if (!group.marker_token) return;
        const markerUrl = getMarkerUrl(group.marker_token);
        const qrSize = 256;
        const padding = 40;
        const width = qrSize + padding * 2;
        const headerHeight = 100;
        const footerHeight = group.marker_pin ? 80 : 40;
        const height = headerHeight + qrSize + footerHeight + padding;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Group code
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(group.code, width / 2, padding + 30);

        // Tee time
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(`Depart: ${group.tee_time}`, width / 2, padding + 55);

        // PIN
        if (group.marker_pin) {
            ctx.fillStyle = '#111111';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(`PIN: ${group.marker_pin}`, width / 2, padding + 80);
        }

        // QR code from the inline SVG
        const svgEl = document.querySelector(`[data-qr-group="${group.id}"] svg`);
        if (!svgEl) return;
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, padding, headerHeight, qrSize, qrSize);

            // URL at bottom
            ctx.fillStyle = '#999999';
            ctx.font = '9px Arial, sans-serif';
            const urlY = headerHeight + qrSize + 20;
            // Truncate URL if too long
            const displayUrl = markerUrl.length > 60 ? markerUrl.substring(0, 57) + '...' : markerUrl;
            ctx.fillText(displayUrl, width / 2, urlY);

            // Download
            const link = document.createElement('a');
            link.download = `qr-${group.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Filter groups by active phase
    const filteredGroups = tournament.phase_count > 1
        ? groups.filter((g) => (g.phase ?? 1) === activePhase)
        : groups;

    return (
        <div className="space-y-4">
            {/* Phase tabs */}
            {tournament.phase_count > 1 && (
                <div className="flex gap-2 mb-2">
                    {Array.from({ length: tournament.phase_count }, (_, i) => i + 1).map((phase) => {
                        const count = groups.filter((g) => (g.phase ?? 1) === phase).length;
                        return (
                            <button
                                key={phase}
                                onClick={() => { setActivePhase(phase); form.setData('phase', phase); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activePhase === phase ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}
                            >
                                Phase {phase} ({count})
                            </button>
                        );
                    })}
                </div>
            )}
            <div className="flex flex-wrap gap-3">
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25">
                    <Plus className="w-4 h-4" />Nouveau groupe
                </button>
                <button onClick={() => setShowMarkerForm(!showMarkerForm)} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover">
                    <UserPlus className="w-4 h-4" />Nouveau marqueur
                </button>
            </div>
            {showMarkerForm && (
                <form onSubmit={handleCreateMarker} className="glass-card space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Creer un marqueur</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Nom</label>
                            <input type="text" required value={markerForm.data.name} onChange={(e) => markerForm.setData('name', e.target.value)} placeholder="Nom complet" className={`w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${markerForm.errors.name ? 'border-destructive' : 'border-border'}`} />
                            {markerForm.errors.name && <p className="text-xs text-destructive mt-1">{markerForm.errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Email</label>
                            <input type="email" required value={markerForm.data.email} onChange={(e) => markerForm.setData('email', e.target.value)} placeholder="email@exemple.com" className={`w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${markerForm.errors.email ? 'border-destructive' : 'border-border'}`} />
                            {markerForm.errors.email && <p className="text-xs text-destructive mt-1">{markerForm.errors.email}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Mot de passe</label>
                            <input type="password" required value={markerForm.data.password} onChange={(e) => markerForm.setData('password', e.target.value)} placeholder="Min. 6 caracteres" className={`w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${markerForm.errors.password ? 'border-destructive' : 'border-border'}`} />
                            {markerForm.errors.password && <p className="text-xs text-destructive mt-1">{markerForm.errors.password}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Trous assignés</label>
                            <div className="flex items-center gap-2">
                                <input type="number" min={1} max={18} value={markerForm.data.hole_start} onChange={(e) => markerForm.setData('hole_start', Number(e.target.value))} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground text-center focus:border-primary focus:outline-none" />
                                <span className="text-muted-foreground text-xs">à</span>
                                <input type="number" min={1} max={18} value={markerForm.data.hole_end} onChange={(e) => markerForm.setData('hole_end', Number(e.target.value))} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground text-center focus:border-primary focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { markerForm.reset(); setShowMarkerForm(false); }} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"><X className="w-4 h-4" />Annuler</button>
                        <button type="submit" disabled={markerForm.processing || !markerForm.data.name.trim() || !markerForm.data.email.trim() || !markerForm.data.password.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50"><Check className="w-4 h-4" />{markerForm.processing ? '...' : 'Creer'}</button>
                    </div>
                </form>
            )}
            {(showForm || editingId) && (
                <form onSubmit={handleSave} className="glass-card space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">{editingId ? 'Modifier le groupe' : 'Nouveau groupe'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournament.phase_count > 1 && (
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Phase</label>
                                <select value={form.data.phase} onChange={(e) => form.setData('phase', Number(e.target.value))} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                                    {Array.from({ length: tournament.phase_count }, (_, i) => i + 1).map((p) => (
                                        <option key={p} value={p}>Phase {p}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Catégorie</label>
                            <select value={form.data.category_id} onChange={(e) => { form.setData('category_id', e.target.value); form.setData('player_ids', []); }} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                                <option value="">— Toutes —</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Heure de depart</label>
                            <input type="time" value={form.data.tee_time} onChange={(e) => form.setData('tee_time', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        </div>
                        {tournament.end_date && (
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Jour de depart</label>
                                <input
                                    type="date"
                                    value={form.data.tee_date}
                                    onChange={(e) => form.setData('tee_date', e.target.value)}
                                    min={formatDateForInput(tournament.start_date)}
                                    max={formatDateForInput(tournament.end_date)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                        )}
                        <div className="sm:col-span-2 lg:col-span-3">
                            <label className="text-xs text-muted-foreground block mb-1">Marqueurs</label>
                            <div className="flex flex-wrap gap-2">
                                {availableMarkers.map((m) => {
                                    const selected = form.data.marker_ids.includes(m.id);
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                                const ids = selected ? form.data.marker_ids.filter((id) => id !== m.id) : [...form.data.marker_ids, m.id];
                                                form.setData('marker_ids', ids);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${selected ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                            {m.name}
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">{(m as any).hole_start ?? 1}-{(m as any).hole_end ?? 18}</span>
                                        </button>
                                    );
                                })}
                                {availableMarkers.length === 0 && <span className="text-xs text-muted-foreground/50 italic">Aucun marqueur disponible</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Téléphone marqueur</label>
                            <input type="tel" value={form.data.marker_phone} onChange={(e) => form.setData('marker_phone', e.target.value)} placeholder="Ex: 241077123456" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        </div>
                        {courses.length > 0 && (
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Parcours</label>
                                <select value={form.data.course_id} onChange={(e) => form.setData('course_id', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                                    <option value="">Parcours principal</option>
                                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    {availablePlayers.length > 0 && (
                        <div>
                            <label className="text-xs text-muted-foreground block mb-2">Joueurs {editingId ? '' : '(non affectes)'}</label>
                            <div className="flex flex-wrap gap-2">
                                {availablePlayers.map((p) => {
                                    const selected = form.data.player_ids.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => togglePlayer(p.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selected ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                            {p.name}
                                            {p.category?.short_name && <span className="text-[10px] opacity-60">{p.category.short_name}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"><X className="w-4 h-4" />Annuler</button>
                        <button type="submit" disabled={form.processing} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90"><Check className="w-4 h-4" />{form.processing ? '...' : editingId ? 'Enregistrer' : 'Creer'}</button>
                    </div>
                </form>
            )}
            {/* Bulk actions */}
            {selectedGroupIds.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{selectedGroupIds.length} groupe{selectedGroupIds.length > 1 ? 's' : ''} sélectionné{selectedGroupIds.length > 1 ? 's' : ''}</span>
                        <button type="button" onClick={() => setSelectedGroupIds([])} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface"><X className="w-3 h-3 inline mr-1" />Désélectionner</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Affecter des marqueurs</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {availableMarkers.map((m) => {
                                    const sel = bulkMarkerIds.includes(m.id);
                                    return (
                                        <button key={m.id} type="button" onClick={() => setBulkMarkerIds((prev) => sel ? prev.filter((id) => id !== m.id) : [...prev, m.id])}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${sel ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface border border-border text-muted-foreground hover:text-foreground'}`}>
                                            <div className={`w-2 h-2 rounded-full ${sel ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                            {m.name} <span className="px-1 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">{(m as any).hole_start ?? 1}-{(m as any).hole_end ?? 18}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                disabled={bulkMarkerIds.length === 0}
                                onClick={() => {
                                    selectedGroupIds.forEach((gid) => {
                                        const g = groups.find((gr) => gr.id === gid);
                                        if (!g) return;
                                        router.put(route('groups.update', [tournament.id, gid]), {
                                            tee_time: g.tee_time, tee_date: g.tee_date ? String(g.tee_date).substring(0, 10) : '', phase: g.phase, category_id: g.category_id ?? '',
                                            course_id: g.course_id ?? '', marker_ids: bulkMarkerIds, marker_phone: g.marker_phone ?? '', player_ids: g.players?.map((p) => p.id) ?? [],
                                        }, { preserveScroll: true });
                                    });
                                    setSelectedGroupIds([]); setBulkMarkerIds([]);
                                }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium disabled:opacity-40"
                            >
                                Affecter aux {selectedGroupIds.length} groupe{selectedGroupIds.length > 1 ? 's' : ''}
                            </button>
                        </div>
                        {courses.length > 0 && (
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Affecter un parcours</label>
                                <div className="flex gap-2">
                                    <select value={bulkCourseId} onChange={(e) => setBulkCourseId(e.target.value)} className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none">
                                        <option value="">Choisir un parcours</option>
                                        <option value="__default__">Parcours principal</option>
                                        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={!bulkCourseId}
                                        onClick={() => {
                                            const courseVal = bulkCourseId === '__default__' ? '' : bulkCourseId;
                                            selectedGroupIds.forEach((gid) => {
                                                const g = groups.find((gr) => gr.id === gid);
                                                if (!g) return;
                                                router.put(route('groups.update', [tournament.id, gid]), {
                                                    tee_time: g.tee_time, tee_date: g.tee_date ? String(g.tee_date).substring(0, 10) : '', phase: g.phase, category_id: g.category_id ?? '',
                                                    course_id: courseVal, marker_id: g.marker_id ?? '', marker_phone: g.marker_phone ?? '', player_ids: g.players?.map((p) => p.id) ?? [],
                                                }, { preserveScroll: true });
                                            });
                                            setSelectedGroupIds([]); setBulkCourseId('');
                                        }}
                                        className="px-4 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 whitespace-nowrap"
                                    >
                                        Affecter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <DataTable data={filteredGroups} searchKeys={['code']} searchPlaceholder="Rechercher un groupe..." defaultPerPage={10}>
                {(paginatedGroups) => (
                    <div className="glass-card !p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 w-10">
                                            <input type="checkbox" checked={paginatedGroups.length > 0 && paginatedGroups.every((g) => selectedGroupIds.includes(g.id))} onChange={(e) => {
                                                if (e.target.checked) { setSelectedGroupIds((prev) => [...new Set([...prev, ...paginatedGroups.map((g) => g.id)])]); }
                                                else { setSelectedGroupIds((prev) => prev.filter((id) => !paginatedGroups.some((g) => g.id === id))); }
                                            }} className="rounded border-border" />
                                        </th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Code</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Départ</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Marqueur</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Joueurs</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Parcours</th>
                                        <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">PIN</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {paginatedGroups.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground italic">Aucun groupe</td></tr>
                                    ) : paginatedGroups.map((group) => (
                                        <tr key={group.id} className={`hover:bg-surface/50 transition-colors ${selectedGroupIds.includes(group.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input type="checkbox" checked={selectedGroupIds.includes(group.id)} onChange={(e) => {
                                                    setSelectedGroupIds((prev) => e.target.checked ? [...prev, group.id] : prev.filter((id) => id !== group.id));
                                                }} className="rounded border-border" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground font-mono">{group.code}</span>
                                                    {tournament.phase_count > 1 && <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px] font-bold">P{group.phase ?? 1}</span>}
                                                    {group.category && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryColors[group.category.name] ?? 'bg-surface-hover text-foreground'}`}>{group.category.short_name}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {group.tee_date && <span>{new Date(group.tee_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · </span>}
                                                    <span>{group.tee_time}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {(group.markers?.length ?? 0) > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {group.markers!.map((m) => (
                                                            <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface text-xs font-medium text-foreground">
                                                                {m.name}
                                                                <span className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold">{(m as any).hole_start ?? 1}-{(m as any).hole_end ?? 18}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : group.marker ? (
                                                    <span className="text-sm font-medium text-foreground">{group.marker.name}</span>
                                                ) : <span className="text-xs text-muted-foreground/50 italic">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-foreground">{group.players?.length ?? 0}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {group.course ? (
                                                    <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-medium">{group.course.name}</span>
                                                ) : <span className="text-[10px] text-muted-foreground/50">Principal</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {group.marker_pin && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => { navigator.clipboard.writeText(group.marker_pin!); setCopiedToken(group.id); setTimeout(() => setCopiedToken(null), 2000); }} className="px-2 py-1 rounded bg-surface hover:bg-surface-hover text-xs font-mono text-foreground transition-colors">
                                                            {copiedToken === group.id ? '✓' : group.marker_pin}
                                                        </button>
                                                        <button onClick={() => router.post(route('groups.regeneratePin', [tournament.id, group.id]), {}, { preserveScroll: true })} className="p-1 rounded hover:bg-surface-hover text-muted-foreground/40 hover:text-foreground transition-colors" title="Régénérer PIN">
                                                            <RefreshCw className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setViewingGroup(group)} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                                                        Voir
                                                    </button>
                                                    <button onClick={() => setShowQR(showQR === group.id ? null : group.id)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors" title="QR Code">
                                                        <QrCode className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(group.id, group.code)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-colors" title="Supprimer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </DataTable>

            {/* Group detail/edit modal */}
            {viewingGroup && (() => {
                const g = groups.find((gr) => gr.id === viewingGroup.id) ?? viewingGroup;
                const gPlayers = g.players ?? [];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setViewingGroup(null)} />
                        <div className="relative w-full max-w-lg bg-sidebar border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-sidebar flex items-center justify-between px-6 py-4 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-black text-foreground font-mono">{g.code}</span>
                                    {tournament.phase_count > 1 && <span className="px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-bold">Phase {g.phase}</span>}
                                    {g.category && <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${categoryColors[g.category.name] ?? 'bg-surface-hover text-foreground'}`}>{g.category.name}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { startEdit(g); setViewingGroup(null); }} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                                        <Pencil className="w-3 h-3 inline mr-1" />Modifier
                                    </button>
                                    <button onClick={() => setViewingGroup(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface"><X className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-border/50">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Départ</span>
                                    <p className="text-sm font-medium text-foreground mt-0.5">
                                        {g.tee_date && `${new Date(g.tee_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · `}{g.tee_time}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Parcours</span>
                                    <p className="text-sm font-medium text-foreground mt-0.5">{g.course?.name ?? 'Principal'}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Marqueur{(g.markers?.length ?? 0) > 1 ? 's' : ''}</span>
                                    <div className="mt-1 space-y-1">
                                        {(g.markers?.length ?? 0) > 0 ? g.markers!.map((m) => (
                                            <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/50 text-sm">
                                                <span className="font-medium text-foreground">{m.name}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">Trous {(m as any).hole_start ?? 1}-{(m as any).hole_end ?? 18}</span>
                                                {m.pivot?.marker_pin && <span className="text-xs text-muted-foreground font-mono ml-auto">PIN {m.pivot.marker_pin}</span>}
                                            </div>
                                        )) : <p className="text-sm text-muted-foreground/50 italic mt-0.5">Non assigné</p>}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">PIN</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-lg font-mono font-black text-amber-400">{g.marker_pin ?? '—'}</p>
                                        <button type="button" onClick={() => router.post(route('groups.regeneratePin', [tournament.id, g.id]), {}, { preserveScroll: true, onSuccess: () => setViewingGroup(null) })} className="p-1 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors" title="Régénérer">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Players */}
                            <div className="px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Joueurs ({gPlayers.length})</span>
                                </div>
                                {gPlayers.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {gPlayers.map((player) => (
                                            <div key={player.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface/50">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${categoryDotColors[player.category?.name ?? ''] ?? 'bg-gray-500'}`} />
                                                    <span className="text-sm font-medium text-foreground">{player.nationality ? countryCodeToFlag(player.nationality) + ' ' : ''}{player.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColors[player.category?.name ?? ''] ?? 'bg-surface-hover text-foreground'}`}>{player.category?.short_name ?? ''}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">HC {player.handicap}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground/50 italic text-center py-4">Aucun joueur dans ce groupe</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 border-t border-border/50 flex gap-2">
                                <button onClick={() => { setShowQR(g.id); setViewingGroup(null); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface border border-border rounded-xl text-xs font-medium text-foreground hover:bg-surface-hover">
                                    <QrCode className="w-3.5 h-3.5" />QR Code
                                </button>
                                {g.marker_phone && g.marker_token && (
                                    <a href={`https://wa.me/${g.marker_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`PIN: ${g.marker_pin}. Lien: ${getMarkerUrl(g.marker_token)}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/20">
                                        <Send className="w-3.5 h-3.5" />WhatsApp
                                    </a>
                                )}
                                <button onClick={() => handleDelete(g.id, g.code)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/20">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* QR Code modal */}
            {showQR && (() => {
                const group = groups.find((g) => g.id === showQR);
                if (!group || !group.marker_token) return null;
                const markerUrl = getMarkerUrl(group.marker_token);
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowQR(null)} />
                        <div className="relative w-full max-w-sm bg-sidebar border border-border rounded-2xl shadow-xl p-6">
                            <button onClick={() => setShowQR(null)} className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                            <div className="flex flex-col items-center text-center">
                                <h3 className="text-lg font-bold text-foreground mb-1">{group.code}</h3>
                                {group.marker_pin && <p className="text-2xl font-mono font-black text-amber-400 tracking-widest mb-4">PIN: {group.marker_pin}</p>}
                                <div className="bg-white p-3 rounded-xl mb-3" data-qr-group={group.id}>
                                    <QRCodeSVG value={markerUrl} size={180} level="M" />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-mono break-all mb-4">{markerUrl}</p>
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => copyMarkerLink(group.marker_token!)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20">
                                        <LinkIcon className="w-3 h-3" />{copiedToken === group.marker_token ? 'Copié !' : 'Copier lien'}
                                    </button>
                                    <button onClick={() => downloadQR(group)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface border border-border text-foreground rounded-xl text-xs font-medium hover:bg-surface-hover">
                                        <Download className="w-3 h-3" />PNG
                                    </button>
                                    {group.marker_phone && (
                                        <a href={`https://wa.me/${group.marker_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`PIN marqueur: ${group.marker_pin}. Lien: ${markerUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-500/20">
                                            <Send className="w-3 h-3" />WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {confirmDialog}
        </div>
    );
}

// --- Course Tab ---
function CourseTab({ tournament, courses, holes, categories, categoryPars }: { tournament: Tournament; courses: Course[]; holes: Hole[]; categories: Category[]; categoryPars: CategoryPar[] }) {
    const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id ?? '');
    const [importingHoles, setImportingHoles] = useState(false);
    const [showNewCourse, setShowNewCourse] = useState(false);
    const [editingCourseName, setEditingCourseName] = useState<string | null>(null);
    const { confirm, confirmDialog } = useConfirm();
    const holeFileRef = useRef<HTMLInputElement>(null);
    const newCourseForm = useForm({ name: '' });
    const renameForm = useForm({ name: '' });

    const courseHoles = holes.filter((h) => h.course_id === activeCourseId);
    const form = useForm({
        holes: courseHoles.map((h) => ({ id: h.id, number: h.number, par: h.par, distance: h.distance, hole_index: h.hole_index })),
    });

    // Reset form when switching courses
    const switchCourse = (courseId: string) => {
        setActiveCourseId(courseId);
        const ch = holes.filter((h) => h.course_id === courseId);
        form.setData('holes', ch.map((h) => ({ id: h.id, number: h.number, par: h.par, distance: h.distance, hole_index: h.hole_index })));
    };

    const updateHole = (idx: number, field: string, value: number) => {
        const updated = [...form.data.holes];
        updated[idx] = { ...updated[idx], [field]: value };
        form.setData('holes', updated);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('holes.update', tournament.id));
    };

    const handleHoleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportingHoles(true);
        router.post(route('holes.import', tournament.id), { file }, {
            forceFormData: true,
            onFinish: () => {
                setImportingHoles(false);
                if (holeFileRef.current) holeFileRef.current.value = '';
            },
        });
    };

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        newCourseForm.post(route('courses.store', tournament.id), {
            onSuccess: () => { newCourseForm.reset(); setShowNewCourse(false); },
        });
    };

    const handleRenameCourse = (courseId: string) => {
        renameForm.put(route('courses.update', [tournament.id, courseId]), {
            onSuccess: () => { setEditingCourseName(null); renameForm.reset(); },
        });
    };

    const handleDeleteCourse = async (courseId: string, name: string) => {
        const ok = await confirm({
            title: 'Supprimer le parcours',
            message: `Supprimer le parcours "${name}" et tous ses trous ?`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('courses.destroy', [tournament.id, courseId]));
    };

    const outHoles = form.data.holes.filter((h) => h.number <= 9);
    const inHoles = form.data.holes.filter((h) => h.number > 9);
    const outPar = outHoles.reduce((s, h) => s + h.par, 0);
    const inPar = inHoles.reduce((s, h) => s + h.par, 0);
    const outDist = outHoles.reduce((s, h) => s + h.distance, 0);
    const inDist = inHoles.reduce((s, h) => s + h.distance, 0);

    const renderHoleRow = (hole: typeof form.data.holes[0], color: string) => {
        const idx = form.data.holes.findIndex((h) => h.id === hole.id);
        return (
            <tr key={hole.id} className="hover:bg-surface transition-colors">
                <td className="px-4 py-3"><span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color} text-sm font-bold`}>{hole.number}</span></td>
                <td className="px-4 py-3 text-center"><input type="number" value={hole.par} onChange={(e) => updateHole(idx, 'par', Number(e.target.value))} className="w-16 text-center bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" /></td>
                <td className="px-4 py-3 text-center"><input type="number" value={hole.distance} onChange={(e) => updateHole(idx, 'distance', Number(e.target.value))} className="w-20 text-center bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" /></td>
                <td className="px-4 py-3 text-center"><input type="number" value={hole.hole_index} onChange={(e) => updateHole(idx, 'hole_index', Number(e.target.value))} className="w-16 text-center bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" /></td>
            </tr>
        );
    };

    return (
        <div className="space-y-6">
            {/* Course selector */}
            <div className="flex flex-wrap items-center gap-2">
                {courses.map((c) => (
                    <div key={c.id} className="flex items-center gap-1">
                        {editingCourseName === c.id ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={renameForm.data.name}
                                    onChange={(e) => renameForm.setData('name', e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRenameCourse(c.id); } if (e.key === 'Escape') setEditingCourseName(null); }}
                                    className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                                    autoFocus
                                />
                                <button onClick={() => handleRenameCourse(c.id)} className="p-1.5 rounded-lg hover:bg-surface-hover text-primary"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingCourseName(null)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => switchCourse(c.id)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCourseId === c.id ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover'}`}
                            >
                                {c.name}
                            </button>
                        )}
                        {activeCourseId === c.id && editingCourseName !== c.id && (
                            <>
                                <button onClick={() => { setEditingCourseName(c.id); renameForm.setData('name', c.name); }} className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground">
                                    <Pencil className="w-3 h-3" />
                                </button>
                                {courses.length > 1 && (
                                    <button onClick={() => handleDeleteCourse(c.id, c.name)} className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}
                {showNewCourse ? (
                    <form onSubmit={handleCreateCourse} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newCourseForm.data.name}
                            onChange={(e) => newCourseForm.setData('name', e.target.value)}
                            placeholder="Nom du parcours"
                            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            autoFocus
                        />
                        <button type="submit" disabled={newCourseForm.processing || !newCourseForm.data.name.trim()} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Check className="w-4 h-4" /></button>
                        <button type="button" onClick={() => { setShowNewCourse(false); newCourseForm.reset(); }} className="p-2 rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground"><X className="w-4 h-4" /></button>
                    </form>
                ) : (
                    <button onClick={() => setShowNewCourse(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover">
                        <Plus className="w-3.5 h-3.5" />Nouveau parcours
                    </button>
                )}
            </div>

            {/* Categories linked to this course */}
            {(() => {
                const courseCategories = categories.filter(c => c.course_id === activeCourseId);
                return courseCategories.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Catégories sur ce parcours :</span>
                        {courseCategories.map((cat) => (
                            <span key={cat.id} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColors[cat.name] ?? 'bg-surface-hover text-foreground'}`}>
                                {cat.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground italic">Aucune catégorie associée à ce parcours.</p>
                );
            })()}

            {/* Import buttons */}
            <div className="flex flex-wrap gap-3">
                <input ref={holeFileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleHoleImport} className="hidden" />
                <button type="button" onClick={() => downloadCsvTemplate('template-parcours.csv', ['number', 'par', 'distance', 'index'], [['1', '4', '350', '7'], ['2', '3', '165', '15']])} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover">
                    <Download className="w-4 h-4" />Template CSV
                </button>
                <button type="button" onClick={() => holeFileRef.current?.click()} disabled={importingHoles} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {importingHoles ? 'Import...' : 'Importer CSV'}
                </button>
            </div>

            {/* Holes table */}
            <form onSubmit={handleSave} className="space-y-6">
                <div className="glass-card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Trou</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Par</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Distance</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Index</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {outHoles.map((h) => renderHoleRow(h, 'bg-emerald-500/20 text-emerald-400'))}
                                <tr className="bg-emerald-500/10 border-y border-border">
                                    <td className="px-4 py-3 text-sm font-bold text-emerald-400">ALLER</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-emerald-400">{outPar}</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-emerald-400">{outDist}m</td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">—</td>
                                </tr>
                                {inHoles.map((h) => renderHoleRow(h, 'bg-blue-500/20 text-blue-400'))}
                                <tr className="bg-blue-500/10 border-y border-border">
                                    <td className="px-4 py-3 text-sm font-bold text-blue-400">RETOUR</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-blue-400">{inPar}</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold text-blue-400">{inDist}m</td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">—</td>
                                </tr>
                                <tr className="bg-amber-500/10 border-t border-border">
                                    <td className="px-4 py-3 text-sm font-black text-foreground">TOTAL</td>
                                    <td className="px-4 py-3 text-center text-sm font-black text-foreground">{outPar + inPar}</td>
                                    <td className="px-4 py-3 text-center text-sm font-black text-foreground">{outDist + inDist}m</td>
                                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">—</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={form.processing} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {form.processing ? 'Sauvegarde...' : 'Sauvegarder le parcours'}
                    </button>
                </div>
            </form>

            {/* Category-specific pars matrix */}
            <CategoryParsMatrix
                tournament={tournament}
                holes={courseHoles}
                categories={categories.filter(c => c.course_id === activeCourseId)}
                categoryPars={categoryPars}
            />
            {confirmDialog}
        </div>
    );
}

function CategoryParsMatrix({ tournament, holes, categories, categoryPars }: {
    tournament: Tournament;
    holes: Hole[];
    categories: Category[];
    categoryPars: CategoryPar[];
}) {
    const [parsData, setParsData] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        for (const cp of categoryPars) {
            map[`${cp.category_id}:${cp.hole_id}`] = cp.par;
        }
        return map;
    });
    const [saving, setSaving] = useState(false);

    // Rebuild parsData when categoryPars prop changes
    const prevCategoryParsRef = useRef(categoryPars);
    if (prevCategoryParsRef.current !== categoryPars) {
        prevCategoryParsRef.current = categoryPars;
        const map: Record<string, number> = {};
        for (const cp of categoryPars) {
            map[`${cp.category_id}:${cp.hole_id}`] = cp.par;
        }
        setParsData(map);
    }

    if (categories.length === 0) {
        return (
            <div className="glass-card">
                <p className="text-sm text-muted-foreground italic">Associez des catégories à ce parcours pour définir les pars par catégorie.</p>
            </div>
        );
    }

    const sortedHoles = [...holes].sort((a, b) => a.number - b.number);

    const getPar = (catId: string, holeId: string, defaultPar: number) => {
        const key = `${catId}:${holeId}`;
        return parsData[key] ?? defaultPar;
    };

    const setPar = (catId: string, holeId: string, value: number) => {
        setParsData(prev => ({ ...prev, [`${catId}:${holeId}`]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        const payload: { category_id: string; hole_id: string; par: number }[] = [];
        for (const cat of categories) {
            for (const hole of sortedHoles) {
                const par = getPar(cat.id, hole.id, hole.par);
                payload.push({ category_id: cat.id, hole_id: hole.id, par });
            }
        }
        router.put(route('holes.updateCategoryPars', tournament.id), { category_pars: payload }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Par par catégorie</h3>
            <div className="glass-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Trou</th>
                                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Par défaut</th>
                                {categories.map(cat => (
                                    <th key={cat.id} className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[cat.name] ?? 'bg-surface-hover text-foreground'}`}>{cat.short_name}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedHoles.map(hole => (
                                <tr key={hole.id} className="hover:bg-surface transition-colors">
                                    <td className="px-4 py-2">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${hole.number <= 9 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{hole.number}</span>
                                    </td>
                                    <td className="px-4 py-2 text-center text-sm text-muted-foreground font-mono">{hole.par}</td>
                                    {categories.map(cat => (
                                        <td key={cat.id} className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                min={3}
                                                max={5}
                                                value={getPar(cat.id, hole.id, hole.par)}
                                                onChange={e => setPar(cat.id, hole.id, Number(e.target.value))}
                                                className="w-14 text-center bg-surface border border-border rounded-lg px-1 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {/* Totals row */}
                            <tr className="bg-amber-500/10 border-t border-border">
                                <td className="px-4 py-3 text-sm font-black text-foreground">TOTAL</td>
                                <td className="px-4 py-3 text-center text-sm font-black text-foreground">{sortedHoles.reduce((s, h) => s + h.par, 0)}</td>
                                {categories.map(cat => (
                                    <td key={cat.id} className="px-4 py-3 text-center text-sm font-black text-foreground">
                                        {sortedHoles.reduce((s, h) => s + getPar(cat.id, h.id, h.par), 0)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving ? 'Sauvegarde...' : 'Enregistrer les pars'}
                </button>
            </div>
        </div>
    );
}

// --- Registrations Tab (admin-only) ---
function RegistrationsTab({ tournament, registrations }: { tournament: Tournament; registrations: Player[] }) {
    const { confirm, confirmDialog } = useConfirm();
    const statusBadge: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-400',
        approved: 'bg-emerald-500/20 text-emerald-400',
        rejected: 'bg-red-500/20 text-red-400',
    };
    const statusLabel: Record<string, string> = {
        pending: 'En attente',
        approved: 'Approuvé',
        rejected: 'Refusé',
    };

    const pendingCount = registrations.filter((r) => r.registration_status === 'pending').length;

    const handleStatusChange = (playerId: string, status: 'approved' | 'rejected') => {
        router.patch(route('registrations.update', [tournament.id, playerId]), { registration_status: status });
    };

    const handleBulk = async (status: 'approved' | 'rejected') => {
        const label = status === 'approved' ? 'approuver' : 'refuser';
        const ok = await confirm({
            title: `${status === 'approved' ? 'Approuver' : 'Refuser'} les inscriptions`,
            message: `Voulez-vous ${label} toutes les inscriptions en attente (${pendingCount}) ?`,
            confirmLabel: status === 'approved' ? 'Approuver' : 'Refuser',
            variant: status === 'rejected' ? 'danger' : 'warning',
        });
        if (!ok) return;
        router.patch(route('registrations.bulkUpdate', tournament.id), { registration_status: status });
    };

    return (
        <div className="space-y-4">
            {pendingCount > 0 && (
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => handleBulk('approved')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-colors">
                        <Check className="w-4 h-4" />Tout approuver ({pendingCount})
                    </button>
                    <button onClick={() => handleBulk('rejected')} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors">
                        <X className="w-4 h-4" />Tout refuser ({pendingCount})
                    </button>
                </div>
            )}
            <DataTable data={registrations} searchKeys={['name', 'email']} searchPlaceholder="Rechercher une inscription...">
                {(paginatedRegistrations) => (
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Joueur</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Email</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Catégorie</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">HC</th>
                                        <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Statut</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedRegistrations.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground italic">Aucun résultat</td>
                                        </tr>
                                    ) : paginatedRegistrations.map((player) => (
                                        <tr key={player.id} className="hover:bg-surface transition-colors">
                                            <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{player.name}</span></td>
                                            <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{player.email ?? '—'}</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${categoryColors[player.category?.name ?? ''] ?? 'bg-surface-hover text-foreground'}`}>
                                                    {player.category?.name ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-sm text-foreground">{player.handicap}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusBadge[player.registration_status]}`}>
                                                    {statusLabel[player.registration_status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {player.registration_status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleStatusChange(player.id, 'approved')}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
                                                        >
                                                            <Check className="w-3 h-3" />Approuver
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(player.id, 'rejected')}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />Refuser
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </DataTable>
            {confirmDialog}
        </div>
    );
}

// --- Payments Tab (admin-only) ---
function PaymentsTab({ tournament, payments }: { tournament: Tournament; payments: (Payment & { player?: Player })[] }) {
    const statusBadge: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-400',
        completed: 'bg-emerald-500/20 text-emerald-400',
        failed: 'bg-red-500/20 text-red-400',
        refunded: 'bg-blue-500/20 text-blue-400',
    };
    const statusLabel: Record<string, string> = {
        pending: 'En attente',
        completed: 'Payé',
        failed: 'Échoué',
        refunded: 'Remboursé',
    };

    return (
        <div className="space-y-4">
            <DataTable data={payments} searchKeys={['player.name', 'ebilling_reference']} searchPlaceholder="Rechercher un paiement...">
                {(paginatedPayments) => (
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Joueur</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Montant</th>
                                        <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Statut</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Référence</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Date</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground italic">Aucun résultat</td>
                                        </tr>
                                    ) : paginatedPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-surface transition-colors">
                                            <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{(payment as any).player?.name ?? '—'}</span></td>
                                            <td className="px-6 py-4"><span className="text-sm text-foreground">{payment.amount} {payment.currency}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusBadge[payment.status]}`}>
                                                    {statusLabel[payment.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-xs font-mono text-muted-foreground">{payment.ebilling_reference ?? '—'}</span></td>
                                            <td className="px-6 py-4"><span className="text-xs text-muted-foreground">{new Date(payment.created_at ?? '').toLocaleDateString('fr-FR')}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {payment.status === 'pending' && (
                                                        <button
                                                            onClick={() => router.patch(route('payments.complete', [tournament.id, payment.id]))}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
                                                        >
                                                            <Check className="w-3 h-3" />Marquer recu
                                                        </button>
                                                    )}
                                                    {payment.status === 'completed' && (
                                                        <a
                                                            href={route('payments.receipt', [tournament.id, payment.id])}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium transition-colors"
                                                        >
                                                            <FileText className="w-3 h-3" />Recu PDF
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </DataTable>
        </div>
    );
}

// --- Flash Messages ---
function FlashMessages() {
    const { flash, errors } = usePage<PageProps & { flash: { success?: string; error?: string }; errors: Record<string, string> }>().props;
    if (!flash?.success && !flash?.error && !Object.keys(errors ?? {}).length) return null;
    return (
        <div className="space-y-2 mb-4">
            {flash?.success && (
                <div className="px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium">{flash.success}</div>
            )}
            {flash?.error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium">{flash.error}</div>
            )}
            {Object.keys(errors ?? {}).length > 0 && (
                <div className="px-4 py-3 rounded-xl bg-red-500/20 text-red-400 text-sm">
                    {Object.values(errors).map((e, i) => <p key={i}>{e}</p>)}
                </div>
            )}
        </div>
    );
}

// --- Scores Tab ---
function ScoresTab({ tournament, players, holes, scores, categories, categoryPars, courses, penalties }: { tournament: Tournament; players: Player[]; holes: Hole[]; scores: Score[]; categories: Category[]; categoryPars: CategoryPar[]; courses: Course[]; penalties: Penalty[] }) {
    const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
    const [filterCourseId, setFilterCourseId] = useState<string>('');
    const [editedScores, setEditedScores] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [showPenaltyForm, setShowPenaltyForm] = useState(false);
    const [penaltyPlayerId, setPenaltyPlayerId] = useState('');
    const [penaltyStrokes, setPenaltyStrokes] = useState(2);
    const [penaltyReason, setPenaltyReason] = useState('');
    const [penaltySaving, setPenaltySaving] = useState(false);

    // Group holes by course
    const courseOptions = useMemo(() => {
        const groups: { id: string; label: string }[] = [];
        const defaultHoles = holes.filter((h) => !h.course_id);
        if (defaultHoles.length > 0) {
            groups.push({ id: 'default', label: 'Parcours principal' });
        }
        for (const c of (courses ?? [])) {
            const courseHoles = holes.filter((h) => h.course_id === c.id);
            if (courseHoles.length > 0) {
                groups.push({ id: c.id, label: c.name });
            }
        }
        return groups;
    }, [holes, courses]);

    // Determine effective course filter
    const effectiveCourseId = useMemo(() => {
        if (filterCourseId) return filterCourseId;
        // Auto-select: prefer default holes (no course_id), else first course
        if (courseOptions.length > 0) return courseOptions[0].id;
        return 'default';
    }, [filterCourseId, courseOptions]);

    // Filter holes by selected course
    const sortedHoles = useMemo(() => {
        const filtered = effectiveCourseId === 'default'
            ? holes.filter((h) => !h.course_id)
            : holes.filter((h) => h.course_id === effectiveCourseId);
        // If no match, show all holes
        if (filtered.length === 0) return [...holes].sort((a, b) => a.number - b.number);
        return [...filtered].sort((a, b) => a.number - b.number);
    }, [holes, effectiveCourseId]);

    const holeNumbers = useMemo(() => sortedHoles.map((h) => h.number), [sortedHoles]);

    const getHeaderPar = (holeNumber: number): number => {
        const hole = sortedHoles.find((h) => h.number === holeNumber);
        return hole?.par ?? 0;
    };

    // For a player + hole number, find the matching hole_id from this course
    const getHoleForPlayer = (_player: Player, holeNumber: number): Hole | undefined => {
        return sortedHoles.find((h) => h.number === holeNumber);
    };

    const filteredPlayers = useMemo(() => {
        const list = filterCategoryId ? players.filter((p) => p.category_id === filterCategoryId) : players;
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [players, filterCategoryId]);

    // Build score lookup: "playerId:holeId" -> strokes
    const scoreLookup = useMemo(() => {
        const map: Record<string, number> = {};
        for (const s of scores) {
            map[`${s.player_id}:${s.hole_id}`] = s.strokes;
        }
        return map;
    }, [scores]);

    const getScore = (playerId: string, holeId: string): number | undefined => {
        const key = `${playerId}:${holeId}`;
        return editedScores[key] ?? scoreLookup[key];
    };

    const setScore = (playerId: string, holeId: string, value: string) => {
        const key = `${playerId}:${holeId}`;
        const num = parseInt(value, 10);
        if (value === '') {
            const next = { ...editedScores };
            delete next[key];
            setEditedScores(next);
        } else if (!isNaN(num) && num >= 1) {
            setEditedScores((prev) => ({ ...prev, [key]: num }));
        }
    };

    const hasChanges = Object.keys(editedScores).some((key) => editedScores[key] !== scoreLookup[key]);

    const handleSave = () => {
        const changedScores = Object.entries(editedScores)
            .filter(([key, val]) => val !== scoreLookup[key])
            .map(([key, strokes]) => {
                const [player_id, hole_id] = key.split(':');
                return { player_id, hole_id, strokes, phase: 1 };
            });

        if (changedScores.length === 0) return;

        setSaving(true);
        router.put(route('scores.update', tournament.id), { scores: changedScores }, {
            preserveScroll: true,
            onFinish: () => {
                setSaving(false);
                setEditedScores({});
            },
        });
    };

    const getScoreColor = (strokes: number | undefined, par: number) => {
        if (strokes === undefined) return '';
        const diff = strokes - par;
        if (diff <= -2) return 'bg-amber-400/30 text-amber-900 dark:text-amber-300';
        if (diff === -1) return 'bg-emerald-400/30 text-emerald-900 dark:text-emerald-300';
        if (diff === 0) return 'bg-card text-foreground';
        if (diff === 1) return 'bg-orange-400/30 text-orange-900 dark:text-orange-300';
        return 'bg-red-400/30 text-red-900 dark:text-red-300';
    };

    const totalScored = scores.length;
    const totalExpected = filteredPlayers.length * holeNumbers.length;
    const progressPct = totalExpected > 0 ? Math.round((totalScored / totalExpected) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Scorecard</h2>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">{filteredPlayers.length} joueur{filteredPlayers.length !== 1 ? 's' : ''}</span>
                            <span className="text-muted-foreground/30">|</span>
                            <span className="text-xs text-muted-foreground">{holeNumbers.length} trous</span>
                            {totalScored > 0 && (
                                <>
                                    <span className="text-muted-foreground/30">|</span>
                                    <span className="text-xs text-primary font-medium">{progressPct}% saisi</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {scores.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { if (window.confirm(`Supprimer les ${scores.length} scores ? Cette action est irréversible.`)) { router.delete(route('scores.reset', tournament.id), { preserveScroll: true }); } }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-sm font-medium hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Vider
                        </button>
                    )}
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Sauvegarde...' : 'Enregistrer'}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilterCategoryId(null)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${!filterCategoryId ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground'}`}
                    >
                        Tous ({players.length})
                    </button>
                    {categories.map((cat) => {
                        const count = players.filter((p) => p.category_id === cat.id).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategoryId(cat.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterCategoryId === cat.id ? `${categoryColors[cat.name] ?? 'bg-primary text-primary-foreground'} shadow-sm` : 'bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground'}`}
                            >
                                {cat.short_name} ({count})
                            </button>
                        );
                    })}
                </div>
                {courseOptions.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:ml-auto">
                        <span className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider mr-1 hidden sm:inline">Parcours</span>
                        {courseOptions.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setFilterCourseId(c.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${effectiveCourseId === c.id ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/25' : 'bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border'}`}
                            >
                                <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />{c.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Scorecard */}
            {filteredPlayers.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium text-muted-foreground">Aucun joueur dans cette catégorie</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Sélectionnez une autre catégorie ou ajoutez des joueurs</p>
                </div>
            ) : (() => {
                const outNums = holeNumbers.filter((n) => n <= 9);
                const inNums = holeNumbers.filter((n) => n > 9);
                const hasIn = inNums.length > 0;
                const outParTotal = outNums.reduce((s, n) => s + getHeaderPar(n), 0);
                const inParTotal = inNums.reduce((s, n) => s + getHeaderPar(n), 0);

                return (
                <div className="rounded-2xl border border-border bg-sidebar/50 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{ minWidth: `${180 + holeNumbers.length * 48 + (hasIn ? 2 : 1) * 52 + 120}px` }}>
                            <thead>
                                {/* Section labels: Aller / Retour */}
                                <tr>
                                    <th className="sticky left-0 z-10 bg-sidebar border-b border-border min-w-[180px]" />
                                    {outNums.length > 0 && (
                                        <th colSpan={outNums.length} className="py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/70 bg-emerald-500/[0.04] border-b-2 border-emerald-500/30">Aller</th>
                                    )}
                                    <th className="py-2.5 text-center text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600/80 bg-emerald-500/[0.08] border-b-2 border-emerald-500/30 min-w-[52px]">OUT</th>
                                    {hasIn && (
                                        <>
                                            <th colSpan={inNums.length} className="py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 bg-blue-500/[0.04] border-b-2 border-blue-500/30">Retour</th>
                                            <th className="py-2.5 text-center text-[10px] font-black uppercase tracking-[0.15em] text-blue-600/80 bg-blue-500/[0.08] border-b-2 border-blue-500/30 min-w-[52px]">IN</th>
                                        </>
                                    )}
                                    <th className="py-2.5 min-w-[56px] border-b border-border" />
                                    <th className="py-2.5 min-w-[56px] border-b border-border" />
                                </tr>
                                {/* Hole numbers + par */}
                                <tr className="border-b border-border bg-sidebar">
                                    <th className="sticky left-0 z-10 bg-sidebar px-4 py-3 text-left">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Joueur</span>
                                    </th>
                                    {outNums.map((num) => (
                                        <th key={num} className="px-0.5 py-2.5 text-center min-w-[46px] bg-emerald-500/[0.02]">
                                            <div className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">{num}</div>
                                            <div className="text-[10px] text-emerald-500/40 font-semibold mt-0.5">par {getHeaderPar(num)}</div>
                                        </th>
                                    ))}
                                    <th className="px-2 py-2.5 text-center bg-emerald-500/[0.08] border-x border-emerald-500/20">
                                        <div className="text-[10px] text-emerald-500/60 font-bold">{outParTotal}</div>
                                    </th>
                                    {hasIn && (
                                        <>
                                            {inNums.map((num) => (
                                                <th key={num} className="px-0.5 py-2.5 text-center min-w-[46px] bg-blue-500/[0.02]">
                                                    <div className="text-[13px] font-black text-blue-600 dark:text-blue-400">{num}</div>
                                                    <div className="text-[10px] text-blue-500/40 font-semibold mt-0.5">par {getHeaderPar(num)}</div>
                                                </th>
                                            ))}
                                            <th className="px-2 py-2.5 text-center bg-blue-500/[0.08] border-x border-blue-500/20">
                                                <div className="text-[10px] text-blue-500/60 font-bold">{inParTotal}</div>
                                            </th>
                                        </>
                                    )}
                                    <th className="px-2 py-2.5 text-center">
                                        <span className="text-[11px] font-bold text-muted-foreground">TOT</span>
                                    </th>
                                    <th className="px-2 py-2.5 text-center">
                                        <span className="text-[11px] font-bold text-muted-foreground">+/−</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlayers.map((player, rowIdx) => {
                                    let totalStrokes = 0;
                                    let totalPar = 0;
                                    let holesPlayed = 0;
                                    let outStrokes = 0;
                                    let outPlayed = 0;
                                    let inStrokes = 0;
                                    let inPlayed = 0;
                                    const isEven = rowIdx % 2 === 0;

                                    const cells = holeNumbers.map((num) => {
                                        const hole = getHoleForPlayer(player, num);
                                        const isOut = num <= 9;
                                        const zoneBg = isOut ? 'bg-emerald-500/[0.015]' : 'bg-blue-500/[0.015]';
                                        if (!hole) {
                                            return <td key={num} className={`px-0.5 py-1.5 text-center ${zoneBg}`}><span className="inline-block w-11 h-10 leading-10 text-muted-foreground/15 text-xs">–</span></td>;
                                        }
                                        const strokes = getScore(player.id, hole.id);
                                        const par = hole.par;
                                        if (strokes !== undefined) {
                                            totalStrokes += strokes;
                                            totalPar += par;
                                            holesPlayed++;
                                            if (isOut) { outStrokes += strokes; outPlayed++; } else { inStrokes += strokes; inPlayed++; }
                                        }
                                        const isEdited = editedScores[`${player.id}:${hole.id}`] !== undefined && editedScores[`${player.id}:${hole.id}`] !== scoreLookup[`${player.id}:${hole.id}`];
                                        return (
                                            <td key={num} className={`px-0.5 py-1.5 text-center ${zoneBg}`}>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={strokes ?? ''}
                                                    onChange={(e) => setScore(player.id, hole.id, e.target.value)}
                                                    className={`w-12 h-11 text-center text-base font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                        isEdited
                                                            ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                                                            : 'border-transparent hover:border-border/60'
                                                    } ${getScoreColor(strokes, par)} ${
                                                        strokes === undefined ? 'bg-surface/30 text-muted-foreground/25' : ''
                                                    }`}
                                                />
                                            </td>
                                        );
                                    });

                                    const outCells = cells.slice(0, outNums.length);
                                    const inCells = cells.slice(outNums.length);
                                    const strokeToPar = totalStrokes - totalPar;

                                    return (
                                        <tr key={player.id} className={`border-b border-border/20 transition-colors hover:bg-surface/40 ${isEven ? '' : 'bg-surface/20'}`}>
                                            <td className="sticky left-0 z-10 px-4 py-2.5 border-r border-border/30" style={{ background: 'hsl(var(--sidebar-background))' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-sidebar ${categoryDotColors[player.category?.name ?? ''] ?? 'bg-gray-500'} ring-transparent`} />
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-foreground truncate max-w-[140px] leading-tight">{player.nationality ? countryCodeToFlag(player.nationality) + ' ' : ''}{player.name}</p>
                                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
                                                            {player.category?.short_name ?? ''}
                                                            {player.handicap > 0 && <span className="ml-1 text-muted-foreground/40">HC {player.handicap}</span>}
                                                            {player.group?.course && <span className="ml-1 text-violet-400/60">{player.group.course.name}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {outCells}
                                            <td className="px-2 py-1.5 text-center bg-emerald-500/[0.06] border-x border-emerald-500/15">
                                                <span className="text-[15px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{outPlayed > 0 ? outStrokes : '–'}</span>
                                            </td>
                                            {hasIn && (
                                                <>
                                                    {inCells}
                                                    <td className="px-2 py-1.5 text-center bg-blue-500/[0.06] border-x border-blue-500/15">
                                                        <span className="text-[15px] font-black text-blue-600 dark:text-blue-400 tabular-nums">{inPlayed > 0 ? inStrokes : '–'}</span>
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-2 py-1.5 text-center">
                                                <span className="text-[15px] font-black text-foreground tabular-nums">{holesPlayed > 0 ? totalStrokes : '–'}</span>
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-[13px] font-black tabular-nums ${
                                                    holesPlayed === 0 ? 'text-muted-foreground/20' :
                                                    strokeToPar < 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                                    strokeToPar === 0 ? 'bg-surface text-foreground/70' :
                                                    'bg-red-500/15 text-red-600 dark:text-red-400'
                                                }`}>
                                                    {holesPlayed > 0 ? (strokeToPar === 0 ? 'E' : `${strokeToPar > 0 ? '+' : ''}${strokeToPar}`) : '–'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-t border-border/30 bg-sidebar/80">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Scores</span>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-400/30" /><span className="text-[10px] text-muted-foreground">Eagle−</span></span>
                                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-400/30" /><span className="text-[10px] text-muted-foreground">Birdie</span></span>
                                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-400/30" /><span className="text-[10px] text-muted-foreground">Bogey</span></span>
                                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-400/30" /><span className="text-[10px] text-muted-foreground">Double+</span></span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 sm:ml-auto">
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">Saisie</span>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><span className="font-mono bg-surface px-1.5 py-0.5 rounded text-foreground font-bold">&#x2191;</span> Augmenter</span>
                                <span className="flex items-center gap-1"><span className="font-mono bg-surface px-1.5 py-0.5 rounded text-foreground font-bold">&#x2193;</span> Diminuer</span>
                                <span className="flex items-center gap-1"><span className="font-mono bg-surface px-1.5 py-0.5 rounded text-foreground font-bold">Tab</span> Case suivante</span>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Penalties section */}
            <div className="rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-sidebar/80 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Pénalités</h3>
                            <p className="text-[10px] text-muted-foreground">{penalties.length} pénalité{penalties.length !== 1 ? 's' : ''} attribuée{penalties.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPenaltyForm(!showPenaltyForm)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-semibold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />Ajouter
                    </button>
                </div>

                {showPenaltyForm && (
                    <div className="px-5 py-4 bg-surface/30 border-b border-border/30">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Joueur</label>
                                <select
                                    value={penaltyPlayerId}
                                    onChange={(e) => setPenaltyPlayerId(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                                >
                                    <option value="">Sélectionner...</option>
                                    {players.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.category?.short_name ?? ''})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Coups</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={penaltyStrokes}
                                    onChange={(e) => setPenaltyStrokes(Number(e.target.value))}
                                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground text-center focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Motif</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={penaltyReason}
                                        onChange={(e) => setPenaltyReason(e.target.value)}
                                        placeholder="Ex: Retard, Comportement, Balle perdue..."
                                        className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none placeholder:text-muted-foreground/40"
                                    />
                                    <button
                                        type="button"
                                        disabled={!penaltyPlayerId || !penaltyReason.trim() || penaltySaving}
                                        onClick={() => {
                                            setPenaltySaving(true);
                                            router.post(route('penalties.store', tournament.id), {
                                                player_id: penaltyPlayerId,
                                                strokes: penaltyStrokes,
                                                reason: penaltyReason,
                                                phase: 1,
                                            }, {
                                                preserveScroll: true,
                                                onFinish: () => {
                                                    setPenaltySaving(false);
                                                    setPenaltyPlayerId('');
                                                    setPenaltyStrokes(2);
                                                    setPenaltyReason('');
                                                    setShowPenaltyForm(false);
                                                },
                                            });
                                        }}
                                        className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                                    >
                                        {penaltySaving ? '...' : 'Appliquer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {penalties.length > 0 ? (
                    <div className="divide-y divide-border/20">
                        {penalties.map((penalty) => (
                            <div key={penalty.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/30 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-black text-red-500">+{penalty.strokes}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">{penalty.player?.name ?? '—'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{penalty.reason}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-muted-foreground">{penalty.creator?.name ?? ''}</p>
                                    {penalty.created_at && (
                                        <p className="text-[10px] text-muted-foreground/50">{new Date(penalty.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => router.delete(route('penalties.destroy', [tournament.id, penalty.id]), { preserveScroll: true })}
                                    className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-5 py-8 text-center">
                        <p className="text-xs text-muted-foreground/50">Aucune pénalité attribuée</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Main Page ---
export default function TournamentManage({ tournament, courses, categories, players, groups, holes, scores, cuts, registrations, payments, markers, categoryPars, penalties }: Props) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { auth } = usePage<PageProps>().props;
    const roles = auth?.roles ?? [];

    const visibleTabs = allTabs.filter((t) => !t.adminOnly || roles.includes('admin'));

    return (
        <AppLayout tournament={tournament}>
            <Head title={tournament.name} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link href={route('admin.dashboard')} className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
                        <p className="text-sm text-muted-foreground">{tournament.club}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-2 px-2">
                {visibleTabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface'}`}>
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <FlashMessages />

            {activeTab === 'dashboard' && <DashboardTab tournament={tournament} players={players} groups={groups} scores={scores} />}
            {activeTab === 'tournament' && <TournamentTab tournament={tournament} players={players} categories={categories} cuts={cuts} />}
            {activeTab === 'categories' && <CategoriesTab tournament={tournament} categories={categories} courses={courses} />}
            {activeTab === 'players' && <PlayersTab tournament={tournament} players={players} categories={categories} groups={groups} />}
            {activeTab === 'groups' && <GroupsTab tournament={tournament} groups={groups} markers={markers} players={players} categories={categories} courses={courses} />}
            {activeTab === 'course' && <CourseTab tournament={tournament} courses={courses} holes={holes} categories={categories} categoryPars={categoryPars} />}
            {activeTab === 'scores' && <ScoresTab tournament={tournament} players={players} holes={holes} scores={scores} categories={categories} categoryPars={categoryPars} courses={courses} penalties={penalties} />}
            {activeTab === 'registrations' && <RegistrationsTab tournament={tournament} registrations={registrations} />}
            {activeTab === 'payments' && <PaymentsTab tournament={tournament} payments={payments} />}
        </AppLayout>
    );
}
