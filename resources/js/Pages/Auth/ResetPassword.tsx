import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Réinitialiser le mot de passe" />

            <h2 className="text-xl font-bold text-foreground text-center mb-1">Nouveau mot de passe</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Choisissez un nouveau mot de passe sécurisé.</p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        autoComplete="username"
                    />
                    {errors.email && <p className="mt-1.5 text-sm text-destructive">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        autoComplete="new-password"
                        autoFocus
                    />
                    {errors.password && <p className="mt-1.5 text-sm text-destructive">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-foreground mb-1.5">Confirmer le mot de passe</label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && <p className="mt-1.5 text-sm text-destructive">{errors.password_confirmation}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 h-12 text-sm font-semibold rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Réinitialiser'}
                </button>
            </form>
        </GuestLayout>
    );
}
