import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Target, Loader2, UserPlus } from 'lucide-react';
import type { Tournament, Category } from '@/types';

interface Props {
    tournament: Tournament;
    categories: Category[];
}

export default function RegistrationCreate({ tournament, categories }: Props) {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        handicap: '',
        category_id: '',
    });

    const selectedCategory = categories.find((c) => c.id === form.data.category_id);
    const fee = selectedCategory?.registration_fee ?? 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('inscription.store', tournament.id));
    };

    return (
        <PublicLayout>
            <Head title={`Inscription - ${tournament.name}`} />

            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {tournament.club} &bull; {new Date(tournament.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {tournament.end_date && tournament.end_date !== tournament.start_date && (
                                <> – {new Date(tournament.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                            )}
                        </p>
                    </div>

                    <div className="glass-card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Inscription</h2>
                                <p className="text-xs text-muted-foreground">Remplissez le formulaire pour vous inscrire</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Nom complet *</label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                                    placeholder="Jean Dupont"
                                    required
                                />
                                {form.errors.name && <p className="mt-1.5 text-sm text-destructive">{form.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                                    placeholder="jean@example.com"
                                    required
                                />
                                {form.errors.email && <p className="mt-1.5 text-sm text-destructive">{form.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Téléphone</label>
                                <input
                                    type="tel"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                                    placeholder="+237 6XX XXX XXX"
                                />
                                {form.errors.phone && <p className="mt-1.5 text-sm text-destructive">{form.errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Handicap *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="54"
                                    value={form.data.handicap}
                                    onChange={(e) => form.setData('handicap', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                                    placeholder="18.5"
                                    required
                                />
                                {form.errors.handicap && <p className="mt-1.5 text-sm text-destructive">{form.errors.handicap}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Catégorie *</label>
                                <select
                                    value={form.data.category_id}
                                    onChange={(e) => form.setData('category_id', e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                    required
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}{cat.registration_fee > 0 ? ` — ${cat.registration_fee} ${tournament.registration_currency}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.category_id && <p className="mt-1.5 text-sm text-destructive">{form.errors.category_id}</p>}
                            </div>

                            {fee > 0 && (
                                <div className="bg-surface rounded-xl p-4 border border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Frais d'inscription</span>
                                        <span className="text-sm font-bold text-amber-400">{fee} {tournament.registration_currency}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {form.processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "S'inscrire"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
