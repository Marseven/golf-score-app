import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Trophy, Save } from 'lucide-react';

export default function TournamentCreate() {
    const form = useForm({
        name: '',
        date: '',
        club: '',
        scoring_mode: 'stroke_play' as 'stroke_play' | 'stableford' | 'both',
        rules: '',
    });

    const scoringModes = [
        { id: 'stroke_play', label: 'Stroke Play', desc: 'Total des coups sur le parcours' },
        { id: 'stableford', label: 'Stableford', desc: 'Points par trou selon le par' },
        { id: 'both', label: 'Les deux', desc: 'Afficher Stroke Play et Stableford' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('tournaments.store'));
    };

    return (
        <AppLayout>
            <Head title="Créer un tournoi" />
            <div className="flex items-center gap-3 mb-6">
                <Link href={route('admin.dashboard')} className="w-10 h-10 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Créer un tournoi</h1>
                    <p className="text-sm text-muted-foreground">Remplissez les informations du tournoi</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        Informations
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Nom du tournoi</label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Ex : Open de Libreville 2026"
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                            {form.errors.name && <p className="text-xs text-destructive mt-1">{form.errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={form.data.date}
                                    onChange={(e) => form.setData('date', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                {form.errors.date && <p className="text-xs text-destructive mt-1">{form.errors.date}</p>}
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Club</label>
                                <input
                                    type="text"
                                    value={form.data.club}
                                    onChange={(e) => form.setData('club', e.target.value)}
                                    placeholder="Ex : Golf Club de Libreville"
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                {form.errors.club && <p className="text-xs text-destructive mt-1">{form.errors.club}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Règlement (optionnel)</label>
                            <textarea
                                value={form.data.rules}
                                onChange={(e) => form.setData('rules', e.target.value)}
                                rows={3}
                                placeholder="Règles spécifiques du tournoi..."
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Mode de calcul</h3>
                    <div className="space-y-3">
                        {scoringModes.map((mode) => (
                            <button
                                type="button"
                                key={mode.id}
                                onClick={() => form.setData('scoring_mode', mode.id as any)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${form.data.scoring_mode === mode.id ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-hover'}`}
                            >
                                <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Link href={route('admin.dashboard')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={form.processing || !form.data.name.trim() || !form.data.date || !form.data.club.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {form.processing ? 'Création...' : 'Créer le tournoi'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
