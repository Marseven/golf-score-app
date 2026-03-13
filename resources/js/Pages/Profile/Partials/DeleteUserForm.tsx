import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function DeleteUserForm() {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setConfirming(false),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const cancel = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-foreground">
                    Supprimer le compte
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Une fois votre compte supprimé, toutes ses données seront définitivement effacées.
                </p>
            </header>

            {!confirming ? (
                <div className="mt-6">
                    <button
                        onClick={() => setConfirming(true)}
                        className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors"
                    >
                        Supprimer le compte
                    </button>
                </div>
            ) : (
                <form onSubmit={deleteUser} className="mt-6 space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                            Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                            Veuillez entrer votre mot de passe pour confirmer.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="delete_password" className="block text-sm font-medium text-foreground mb-1.5">
                            Mot de passe
                        </label>
                        <input
                            id="delete_password"
                            ref={passwordInput}
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoFocus
                            placeholder="Votre mot de passe"
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                        />
                        {errors.password && <p className="mt-1.5 text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={cancel}
                            className="px-6 py-2.5 bg-surface border border-border text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirmer la suppression
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}
