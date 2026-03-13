import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function UpdatePasswordForm() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-foreground">
                    Mot de passe
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Utilisez un mot de passe long et aléatoire pour sécuriser votre compte.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-foreground mb-1.5">
                        Mot de passe actuel
                    </label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                    {errors.current_password && <p className="mt-1.5 text-sm text-destructive">{errors.current_password}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                        Nouveau mot de passe
                    </label>
                    <input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                    {errors.password && <p className="mt-1.5 text-sm text-destructive">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-foreground mb-1.5">
                        Confirmer le mot de passe
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                    {errors.password_confirmation && <p className="mt-1.5 text-sm text-destructive">{errors.password_confirmation}</p>}
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                        Enregistrer
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-emerald-400">Enregistré.</p>
                    )}
                </div>
            </form>
        </section>
    );
}
