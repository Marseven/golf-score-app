import { useState, useRef, useMemo } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Settings, BarChart3, Trophy, Users, Target, MapPin, Save, Plus, Trash2, Pencil, X, Check, RefreshCw, Clock, Copy, UserPlus, Send, FileText, FileSpreadsheet, QrCode, Flag, Tag, UserCheck, CreditCard, LinkIcon, Download, Hash, Upload, Scissors } from 'lucide-react';
import type { Tournament, Category, Player, Group, Hole, Score, Payment, Course, Cut, CategoryPar, PageProps } from '@/types';
import { categoryColors, categoryDotColors } from '@/Lib/category-colors';
import DataTable from '@/Components/DataTable';
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
    { id: 'registrations', label: 'Inscriptions', icon: UserCheck, adminOnly: true },
    { id: 'payments', label: 'Paiements', icon: CreditCard, adminOnly: true },
];

// --- Dashboard Tab ---
function DashboardTab({ tournament, players, groups, scores }: { tournament: Tournament; players: Player[]; groups: Group[]; scores: Score[] }) {
    const [showQRModal, setShowQRModal] = useState(false);
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
    const [cutCounts, setCutCounts] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        (categories ?? []).forEach((cat) => {
            const catPlayers = players.filter((p) => p.category_id === cat.id).length;
            const existingCut = cuts?.find((c) => c.category_id === cat.id && c.after_phase === 1);
            initial[cat.id] = existingCut?.qualified_count ?? Math.ceil(catPlayers / 2);
        });
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
            <div className={`glass-card flex items-center justify-between ${form.data.registration_open ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.data.registration_open ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                        <UserPlus className={`w-5 h-5 ${form.data.registration_open ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {form.data.registration_open ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {form.data.registration_open ? 'Les joueurs peuvent s\'inscrire en ligne' : 'Les inscriptions en ligne sont désactivées'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => form.setData('registration_open', !form.data.registration_open)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${form.data.registration_open ? 'bg-primary' : 'bg-surface-hover border border-border'}`}
                >
                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${form.data.registration_open ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
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

            {/* Cut section — per phase and per category */}
            {tournament.phase_count > 1 && Array.from({ length: tournament.phase_count - 1 }, (_, i) => i + 1).map((afterPhase) => {
                const phaseCuts = cuts.filter((c) => c.after_phase === afterPhase);
                const allApplied = phaseCuts.length > 0 && phaseCuts.every((c) => c.applied_at);

                return (
                    <div key={afterPhase} className="glass-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <Scissors className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Cut après Phase {afterPhase}</h3>
                                <p className="text-xs text-muted-foreground">Éliminer les joueurs par catégorie</p>
                            </div>
                            {allApplied && (
                                <span className="ml-auto px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium">Appliqué</span>
                            )}
                        </div>
                        {allApplied ? (
                            <div className="space-y-2">
                                {phaseCuts.map((cut) => (
                                    <div key={cut.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface">
                                        <span className="text-sm text-foreground">{cut.category?.name ?? '—'}</span>
                                        <span className="text-sm text-muted-foreground">Top {cut.qualified_count} qualifiés</span>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm(`Réinitialiser le cut après Phase ${afterPhase} ? Les joueurs redeviendront actifs.`)) {
                                            router.post(route('tournaments.resetPhaseCut', tournament.id), { after_phase: afterPhase });
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors mt-2"
                                >
                                    <RefreshCw className="w-4 h-4" />Réinitialiser
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(categories ?? []).map((cat) => {
                                    const catPlayers = players.filter((p) => p.category_id === cat.id).length;
                                    const key = `${afterPhase}-${cat.id}`;
                                    return (
                                        <div key={cat.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface">
                                            <span className="text-sm font-medium text-foreground min-w-[120px]">{cat.name}</span>
                                            <span className="text-xs text-muted-foreground">({catPlayers} joueurs)</span>
                                            <div className="ml-auto flex items-center gap-2">
                                                <label className="text-xs text-muted-foreground">Qualifiés :</label>
                                                <input
                                                    type="number"
                                                    value={cutCounts[cat.id] ?? Math.ceil(catPlayers / 2)}
                                                    onChange={(e) => setCutCounts((prev) => ({ ...prev, [cat.id]: Number(e.target.value) }))}
                                                    min={1}
                                                    max={catPlayers}
                                                    className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-center focus:border-primary focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cutsPayload = (categories ?? []).map((cat) => ({
                                            category_id: cat.id,
                                            qualified_count: cutCounts[cat.id] ?? Math.ceil(players.filter((p) => p.category_id === cat.id).length / 2),
                                        }));
                                        if (confirm(`Appliquer le cut après Phase ${afterPhase} ?`)) {
                                            router.post(route('tournaments.applyPhaseCut', tournament.id), {
                                                after_phase: afterPhase,
                                                cuts: cutsPayload,
                                            });
                                        }
                                    }}
                                    disabled={players.length === 0}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <Scissors className="w-4 h-4" />Appliquer le cut
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

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
        </form>
    );
}

// --- Categories Tab ---
function CategoriesTab({ tournament, categories, courses }: { tournament: Tournament; categories: Category[]; courses: Course[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const form = useForm({ name: '', short_name: '', color: 'blue', registration_fee: 0, course_id: courses[0]?.id ?? '', handicap_coefficient: 1.0 });

    const colorOptions = ['blue', 'pink', 'emerald', 'violet', 'amber', 'red', 'cyan', 'orange'];

    const resetForm = () => { form.reset(); setShowForm(false); setEditingId(null); };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        form.setData({ name: cat.name, short_name: cat.short_name, color: cat.color, registration_fee: cat.registration_fee ?? 0, course_id: cat.course_id ?? courses[0]?.id ?? '', handicap_coefficient: cat.handicap_coefficient ?? 1.0 });
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

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;
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
        </div>
    );
}

// --- Players Tab ---
function PlayersTab({ tournament, players, categories, groups }: { tournament: Tournament; players: Player[]; categories: Category[]; groups: Group[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const form = useForm({ name: '', handicap: 0, category_id: '', group_id: '', email: '', phone: '' });

    const resetForm = () => { form.reset(); setShowForm(false); setEditingId(null); };

    const startEdit = (player: Player) => {
        setEditingId(player.id);
        form.setData({ name: player.name, handicap: player.handicap, category_id: player.category_id ?? '', group_id: player.group_id ?? '', email: player.email ?? '', phone: player.phone ?? '' });
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

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Supprimer le joueur "${name}" ?`)) return;
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
                                            <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{player.name}</span></td>
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
        </div>
    );
}

// --- Groups Tab (enriched with marker, PIN, QR code, phase filtering) ---
function GroupsTab({ tournament, groups, markers, players, categories }: { tournament: Tournament; groups: Group[]; markers: MarkerUser[]; players: Player[]; categories: Category[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showQR, setShowQR] = useState<string | null>(null);
    const [showMarkerForm, setShowMarkerForm] = useState(false);
    const [activePhase, setActivePhase] = useState(1);
    const form = useForm({ tee_time: '08:00', tee_date: '', phase: 1, category_id: '' as string, marker_id: '', marker_phone: '', player_ids: [] as string[] });
    const markerForm = useForm({ name: '', email: '', password: '' });

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

    // Markers not assigned to any other group
    const assignedMarkerIds = groups
        .filter((g) => g.marker_id && g.id !== editingId)
        .map((g) => g.marker_id);
    const availableMarkers = markers.filter((m) => !assignedMarkerIds.includes(m.id));

    const startEdit = (group: Group) => {
        setEditingId(group.id);
        form.setData({
            tee_time: group.tee_time,
            tee_date: group.tee_date ? group.tee_date.substring(0, 10) : '',
            phase: group.phase ?? 1,
            category_id: group.category_id ?? '',
            marker_id: group.marker_id ?? '',
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

    const handleDelete = (id: string, code: string) => {
        if (!confirm(`Supprimer le groupe "${code}" ?`)) return;
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
                            <input type="text" value={markerForm.data.name} onChange={(e) => markerForm.setData('name', e.target.value)} placeholder="Nom complet" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                            {markerForm.errors.name && <p className="text-xs text-destructive mt-1">{markerForm.errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Email</label>
                            <input type="email" value={markerForm.data.email} onChange={(e) => markerForm.setData('email', e.target.value)} placeholder="email@exemple.com" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                            {markerForm.errors.email && <p className="text-xs text-destructive mt-1">{markerForm.errors.email}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Mot de passe</label>
                            <input type="password" value={markerForm.data.password} onChange={(e) => markerForm.setData('password', e.target.value)} placeholder="Min. 6 caracteres" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                            {markerForm.errors.password && <p className="text-xs text-destructive mt-1">{markerForm.errors.password}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { markerForm.reset(); setShowMarkerForm(false); }} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"><X className="w-4 h-4" />Annuler</button>
                        <button type="submit" disabled={markerForm.processing || !markerForm.data.name.trim() || !markerForm.data.email.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90"><Check className="w-4 h-4" />{markerForm.processing ? '...' : 'Creer'}</button>
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
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Marqueur</label>
                            <select value={form.data.marker_id} onChange={(e) => form.setData('marker_id', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none">
                                <option value="">-- Aucun marqueur --</option>
                                {availableMarkers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Téléphone marqueur</label>
                            <input type="tel" value={form.data.marker_phone} onChange={(e) => form.setData('marker_phone', e.target.value)} placeholder="Ex: 241077123456" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredGroups.map((group) => (
                    <div key={group.id} className="glass-card p-0 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-foreground">{group.code}</span>
                                {tournament.phase_count > 1 && (
                                    <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 text-[10px] font-bold">P{group.phase ?? 1}</span>
                                )}
                                {group.category && (
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${categoryColors[group.category.name] ?? 'bg-surface-hover text-foreground'}`}>{group.category.short_name}</span>
                                )}
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs">
                                        {group.tee_date && `${new Date(group.tee_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · `}
                                        {group.tee_time}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyCode(group.code)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
                                    <span className="text-xs font-mono text-muted-foreground">{group.code}</span>
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                </button>
                                <button onClick={() => startEdit(group)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(group.id, group.code)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Marker info + PIN + Link (always visible) */}
                        <div className="px-5 py-3 border-b border-border space-y-3">
                            {group.marker ? (
                                <div className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-primary" />
                                    <span className="text-sm text-foreground">{group.marker.name}</span>
                                    <span className="text-xs text-muted-foreground">({group.marker.email})</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground italic">Aucun marqueur assigne</span>
                                </div>
                            )}

                            {group.marker_token && (
                                <div className="flex flex-wrap items-center gap-3">
                                    {group.marker_pin && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <Hash className="w-4 h-4 text-amber-400" />
                                            <span className="text-lg font-mono font-black text-amber-400 tracking-widest">{group.marker_pin}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => copyMarkerLink(group.marker_token!)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors border border-primary/20"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        {copiedToken === group.marker_token ? 'Copie !' : 'Copier le lien marqueur'}
                                    </button>
                                    <button
                                        onClick={() => setShowQR(showQR === group.id ? null : group.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${showQR === group.id ? 'bg-primary/20 text-primary border-primary/20' : 'bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border-border'}`}
                                    >
                                        <QrCode className="w-3.5 h-3.5" />
                                        QR Code
                                    </button>
                                </div>
                            )}

                            {group.marker_phone && group.marker_token && (
                                <a
                                    href={`https://wa.me/${group.marker_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, votre PIN marqueur: ${group.marker_pin}. Accès scoring: ${getMarkerUrl(group.marker_token)}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors border border-emerald-500/20"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    WhatsApp
                                </a>
                            )}
                        </div>

                        {/* QR Code inline */}
                        {showQR === group.id && group.marker_token && (
                            <div className="px-5 py-4 border-b border-border flex flex-col items-center gap-3 bg-surface/30">
                                <div className="bg-white p-3 rounded-xl" data-qr-group={group.id}>
                                    <QRCodeSVG
                                        value={getMarkerUrl(group.marker_token)}
                                        size={180}
                                        level="M"
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground font-mono break-all max-w-[220px] text-center">{getMarkerUrl(group.marker_token)}</p>
                                <button
                                    onClick={() => downloadQR(group)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground text-xs font-medium transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Telecharger PNG
                                </button>
                            </div>
                        )}

                        <ul className="divide-y divide-white/5">
                            {group.players?.length ? group.players.map((player) => (
                                <li key={player.id} className="flex items-center justify-between px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${categoryDotColors[player.category?.name ?? ''] ?? 'bg-gray-500'}`} />
                                        <span className="text-sm font-medium text-foreground">{player.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">HC {player.handicap}</span>
                                </li>
                            )) : (
                                <li className="px-5 py-4 text-xs text-muted-foreground italic">Aucun joueur</li>
                            )}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Course Tab ---
function CourseTab({ tournament, courses, holes, categories, categoryPars }: { tournament: Tournament; courses: Course[]; holes: Hole[]; categories: Category[]; categoryPars: CategoryPar[] }) {
    const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id ?? '');
    const [importingHoles, setImportingHoles] = useState(false);
    const [showNewCourse, setShowNewCourse] = useState(false);
    const [editingCourseName, setEditingCourseName] = useState<string | null>(null);
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

    const handleDeleteCourse = (courseId: string, name: string) => {
        if (!confirm(`Supprimer le parcours "${name}" et tous ses trous ?`)) return;
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

    const handleBulk = (status: 'approved' | 'rejected') => {
        const label = status === 'approved' ? 'approuver' : 'refuser';
        if (!confirm(`Voulez-vous ${label} toutes les inscriptions en attente (${pendingCount}) ?`)) return;
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

// --- Main Page ---
export default function TournamentManage({ tournament, courses, categories, players, groups, holes, scores, cuts, registrations, payments, markers, categoryPars }: Props) {
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
            {activeTab === 'groups' && <GroupsTab tournament={tournament} groups={groups} markers={markers} players={players} categories={categories} />}
            {activeTab === 'course' && <CourseTab tournament={tournament} courses={courses} holes={holes} categories={categories} categoryPars={categoryPars} />}
            {activeTab === 'registrations' && <RegistrationsTab tournament={tournament} registrations={registrations} />}
            {activeTab === 'payments' && <PaymentsTab tournament={tournament} payments={payments} />}
        </AppLayout>
    );
}
