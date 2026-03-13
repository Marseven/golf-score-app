import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2 } from 'lucide-react';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-foreground">
                    Informations du profil
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Mettez à jour votre nom et votre adresse email.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                        Nom
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        autoFocus
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                    {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                    {errors.email && <p className="mt-1.5 text-sm text-destructive">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Votre adresse email n'est pas vérifiée.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="text-sm text-primary underline hover:text-primary/80"
                            >
                                Renvoyer le lien de vérification.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-emerald-400">
                                Un nouveau lien de vérification a été envoyé à votre adresse email.
                            </div>
                        )}
                    </div>
                )}

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
