import { Head, useForm } from '@inertiajs/react';
import { Target, Loader2 } from 'lucide-react';

export default function MarkerLogin() {
    const form = useForm({ code: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('marqueur.authenticate'));
    };

    return (
        <>
            <Head title="Connexion Marqueur" />
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-sm space-y-8 text-center">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Target className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Connexion Marqueur</h1>
                        <p className="text-sm text-muted-foreground mt-2">Entrez le code fourni par l'organisateur</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={form.data.code}
                            onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                            placeholder="GOLF-2026-G1"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-foreground text-xl font-mono text-center uppercase tracking-widest focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        />
                        {form.errors.code && (
                            <p className="mt-2 text-sm text-destructive">{form.errors.code}</p>
                        )}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-14 text-base font-semibold rounded-xl flex items-center justify-center disabled:opacity-50"
                        >
                            {form.processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accéder au groupe'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
