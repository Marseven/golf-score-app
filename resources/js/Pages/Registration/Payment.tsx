import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Target, Loader2, CreditCard } from 'lucide-react';
import type { Tournament, Player } from '@/types';

interface Props {
    tournament: Tournament;
    player: Player;
}

export default function RegistrationPayment({ tournament, player }: Props) {
    const form = useForm({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('paiement.store', [tournament.id, player.id]));
    };

    return (
        <PublicLayout>
            <Head title={`Paiement - ${tournament.name}`} />

            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">Inscription de {player.name}</p>
                    </div>

                    <div className="glass-card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Paiement</h2>
                                <p className="text-xs text-muted-foreground">Frais d'inscription au tournoi</p>
                            </div>
                        </div>

                        <div className="bg-surface rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Tournoi</span>
                                <span className="text-sm font-medium text-foreground">{tournament.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Joueur</span>
                                <span className="text-sm font-medium text-foreground">{player.name}</span>
                            </div>
                            <div className="border-t border-border pt-2 mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-foreground">Montant</span>
                                    <span className="text-lg font-bold text-amber-400">
                                        {tournament.registration_fee} {tournament.registration_currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-lg shadow-amber-500/25 h-12 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {form.processing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Payer via Ebilling
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
