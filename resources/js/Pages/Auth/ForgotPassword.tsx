import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Mot de passe oublié" />

            <h2 className="text-xl font-bold text-foreground text-center mb-1">Mot de passe oublié</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
                Entrez votre email pour recevoir un lien de réinitialisation.
            </p>

            {status && (
                <div className="mb-4 text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-xl px-4 py-3">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        autoFocus
                    />
                    {errors.email && <p className="mt-1.5 text-sm text-destructive">{errors.email}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 text-sm font-semibold rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href={route('login')} className="text-primary hover:text-primary/80 font-medium">
                        Retour à la connexion
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
