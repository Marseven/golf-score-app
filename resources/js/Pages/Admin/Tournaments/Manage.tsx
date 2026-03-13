import { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Settings, BarChart3, Trophy, Users, Target, MapPin, Save, Plus, Trash2, Pencil, X, Check, RefreshCw, Clock, Copy, UserPlus, Send, FileText, FileSpreadsheet, QrCode, Flag, Tag, UserCheck, CreditCard, LinkIcon } from 'lucide-react';
import type { Tournament, Category, Player, Group, Hole, Score, Payment, PageProps } from '@/types';
import { categoryColors, categoryDotColors } from '@/Lib/category-colors';

interface Props {
    tournament: Tournament;
    categories: Category[];
    players: Player[];
    groups: Group[];
    holes: Hole[];
    scores: Score[];
    registrations: Player[];
    payments: Payment[];
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
function DashboardTab({ players, groups, scores }: { players: Player[]; groups: Group[]; scores: Score[] }) {
    const syncedCount = scores.filter((s) => s.synced).length;
    const totalHoles = players.length * 18;
    const progress = totalHoles > 0 ? Math.round((scores.length / totalHoles) * 100) : 0;

    const stats = [
        { label: 'Joueurs inscrits', value: String(players.length), icon: Users, color: 'bg-blue-500/20 text-blue-400' },
        { label: 'Groupes', value: String(groups.length), icon: Target, color: 'bg-emerald-500/20 text-emerald-400' },
        { label: 'Progression', value: `${progress}%`, icon: Flag, color: 'bg-amber-500/20 text-amber-400' },
        { label: 'Scores sync.', value: String(syncedCount), icon: RefreshCw, color: 'bg-violet-500/20 text-violet-400' },
    ];

    const quickActions = [
        { label: 'WhatsApp', desc: 'Diffuser résultats', icon: Send, color: 'text-emerald-400' },
        { label: 'Export PDF', desc: 'Classement officiel', icon: FileText, color: 'text-red-400' },
        { label: 'Export Excel', desc: 'Données complètes', icon: FileSpreadsheet, color: 'text-green-400' },
        { label: 'QR Codes', desc: 'Accès public', icon: QrCode, color: 'text-blue-400' },
    ];

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
                        <button key={action.label} className="glass-card hover:bg-surface-hover transition-colors cursor-pointer text-left">
                            <action.icon className={`w-6 h-6 ${action.color} mb-3`} />
                            <p className="text-sm font-semibold text-foreground">{action.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Tournament Tab ---
function TournamentTab({ tournament }: { tournament: Tournament }) {
    const form = useForm({
        name: tournament.name,
        date: tournament.date,
        club: tournament.club,
        status: tournament.status,
        scoring_mode: tournament.scoring_mode,
        rules: tournament.rules || '',
        registration_open: tournament.registration_open,
        registration_fee: tournament.registration_fee,
        registration_currency: tournament.registration_currency,
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

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Informations</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Nom du tournoi</label>
                            <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Date</label>
                                <input type="date" value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Statut</label>
                                <select value={form.data.status} onChange={(e) => form.setData('status', e.target.value as any)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors appearance-none">
                                    <option value="draft">Brouillon</option>
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
function CategoriesTab({ tournament, categories }: { tournament: Tournament; categories: Category[] }) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const form = useForm({ name: '', short_name: '', color: 'blue' });

    const colorOptions = ['blue', 'pink', 'emerald', 'violet', 'amber', 'red', 'cyan', 'orange'];

    const resetForm = () => { form.reset(); setShowForm(false); setEditingId(null); };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        form.setData({ name: cat.name, short_name: cat.short_name, color: cat.color });
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Nom</label>
                    <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Ex: Pro H" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Abréviation</label>
                    <input type="text" value={form.data.short_name} onChange={(e) => form.setData('short_name', e.target.value)} placeholder="Ex: PH" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
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
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Couleur</th>
                                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-surface transition-colors">
                                    <td className="px-6 py-4"><span className="text-sm font-medium text-foreground">{cat.name}</span></td>
                                    <td className="px-6 py-4"><span className="text-sm text-foreground">{cat.short_name}</span></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full ${categoryDotColors[cat.name] ?? 'bg-gray-500'}`} />
                                            <span className="text-xs text-muted-foreground">{cat.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => startEdit(cat)} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
            </div>
            {formUI}
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
                            {players.map((player) => (
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
        </div>
    );
}

// --- Groups Tab (enriched with marker) ---
function GroupsTab({ tournament, groups }: { tournament: Tournament; groups: Group[] }) {
    const [showForm, setShowForm] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const form = useForm({ tee_time: '08:00', marker_name: '', marker_email: '' });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('groups.store', tournament.id), { onSuccess: () => { setShowForm(false); form.reset(); } });
    };

    const handleDelete = (id: string, code: string) => {
        if (!confirm(`Supprimer le groupe "${code}" ?`)) return;
        router.delete(route('groups.destroy', [tournament.id, id]));
    };

    const copyMarkerLink = (token: string) => {
        const link = `${window.location.origin}${route('marqueur.token', token, false)}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25">
                    <Plus className="w-4 h-4" />Nouveau groupe
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleCreate} className="glass-card space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Nouveau groupe</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Heure de départ</label>
                            <input type="time" value={form.data.tee_time} onChange={(e) => form.setData('tee_time', e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Nom du marqueur</label>
                            <input type="text" value={form.data.marker_name} onChange={(e) => form.setData('marker_name', e.target.value)} placeholder="Optionnel" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Email du marqueur</label>
                            <input type="email" value={form.data.marker_email} onChange={(e) => form.setData('marker_email', e.target.value)} placeholder="Optionnel" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover"><X className="w-4 h-4" />Annuler</button>
                        <button type="submit" disabled={form.processing} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90"><Check className="w-4 h-4" />{form.processing ? '...' : 'Créer'}</button>
                    </div>
                </form>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groups.map((group) => (
                    <div key={group.id} className="glass-card p-0 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-foreground">{group.code}</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs">Départ: {group.tee_time}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyCode(group.code)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
                                    <span className="text-xs font-mono text-muted-foreground">{group.code}</span>
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                </button>
                                <button onClick={() => handleDelete(group.id, group.code)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Marker info */}
                        <div className="px-5 py-3 border-b border-border">
                            {group.marker ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-primary" />
                                        <span className="text-sm text-foreground">{group.marker.name}</span>
                                        <span className="text-xs text-muted-foreground">({group.marker.email})</span>
                                    </div>
                                    {group.marker_token && (
                                        <button
                                            onClick={() => copyMarkerLink(group.marker_token!)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            {copiedToken === group.marker_token ? 'Copié !' : 'Copier le lien'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground italic">Aucun marqueur assigné</span>
                                    {group.marker_token && (
                                        <button
                                            onClick={() => copyMarkerLink(group.marker_token!)}
                                            className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground text-xs transition-colors"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            {copiedToken === group.marker_token ? 'Copié !' : 'Lien marqueur'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

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
function CourseTab({ tournament, holes }: { tournament: Tournament; holes: Hole[] }) {
    const form = useForm({
        holes: holes.map((h) => ({ id: h.id, number: h.number, par: h.par, distance: h.distance, hole_index: h.hole_index })),
    });

    const updateHole = (idx: number, field: string, value: number) => {
        const updated = [...form.data.holes];
        updated[idx] = { ...updated[idx], [field]: value };
        form.setData('holes', updated);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('holes.update', tournament.id));
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

    const handleStatusChange = (playerId: string, status: 'approved' | 'rejected') => {
        router.patch(route('registrations.update', [tournament.id, playerId]), { registration_status: status });
    };

    return (
        <div className="space-y-4">
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
                            {registrations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground italic">Aucune inscription</td>
                                </tr>
                            ) : registrations.map((player) => (
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
        </div>
    );
}

// --- Payments Tab (admin-only, read-only) ---
function PaymentsTab({ payments }: { payments: (Payment & { player?: Player })[] }) {
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground italic">Aucun paiement</td>
                                </tr>
                            ) : payments.map((payment) => (
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---
export default function TournamentManage({ tournament, categories, players, groups, holes, scores, registrations, payments }: Props) {
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

            {activeTab === 'dashboard' && <DashboardTab players={players} groups={groups} scores={scores} />}
            {activeTab === 'tournament' && <TournamentTab tournament={tournament} />}
            {activeTab === 'categories' && <CategoriesTab tournament={tournament} categories={categories} />}
            {activeTab === 'players' && <PlayersTab tournament={tournament} players={players} categories={categories} groups={groups} />}
            {activeTab === 'groups' && <GroupsTab tournament={tournament} groups={groups} />}
            {activeTab === 'course' && <CourseTab tournament={tournament} holes={holes} />}
            {activeTab === 'registrations' && <RegistrationsTab tournament={tournament} registrations={registrations} />}
            {activeTab === 'payments' && <PaymentsTab payments={payments} />}
        </AppLayout>
    );
}
