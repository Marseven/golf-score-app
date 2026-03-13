import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Target, CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react';

interface Props {
    payment: {
        id: string;
        status: 'pending' | 'completed' | 'failed' | 'refunded';
        amount: number;
        currency: string;
    };
    tournament: {
        id: string;
        name: string;
    };
    player: {
        id: string;
        name: string;
    };
}

const statusConfig = {
    pending: {
        icon: Clock,
        label: 'Paiement en attente',
        description: 'Votre paiement est en cours de traitement. Vous recevrez une confirmation une fois le paiement validé.',
        color: 'text-amber-400',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/20',
    },
    completed: {
        icon: CheckCircle,
        label: 'Paiement confirmé',
        description: 'Votre inscription a été validée avec succès. Vous êtes inscrit au tournoi.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/20',
    },
    failed: {
        icon: XCircle,
        label: 'Paiement échoué',
        description: 'Le paiement n\'a pas pu être traité. Veuillez réessayer ou contacter l\'organisateur.',
        color: 'text-red-400',
        bg: 'bg-red-500/20',
        border: 'border-red-500/20',
    },
    refunded: {
        icon: CheckCircle,
        label: 'Paiement remboursé',
        description: 'Votre paiement a été remboursé.',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/20',
    },
};

export default function PaymentStatus({ payment, tournament, player }: Props) {
    const config = statusConfig[payment.status];
    const StatusIcon = config.icon;

    return (
        <PublicLayout>
            <Head title={`Statut du paiement - ${tournament.name}`} />

            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{player.name}</p>
                    </div>

                    <div className="glass-card">
                        <div className={`flex flex-col items-center text-center p-6 rounded-xl ${config.bg} border ${config.border} mb-6`}>
                            <StatusIcon className={`w-12 h-12 ${config.color} mb-3`} />
                            <h2 className={`text-lg font-semibold ${config.color}`}>{config.label}</h2>
                            <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
                        </div>

                        <div className="bg-surface rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Montant</span>
                                <span className="text-sm font-medium text-foreground">{payment.amount} {payment.currency}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Joueur</span>
                                <span className="text-sm font-medium text-foreground">{player.name}</span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={route('classement', tournament.id)}
                        className="flex items-center justify-center gap-2 w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-colors"
                    >
                        <BarChart3 className="w-5 h-5" />
                        Voir le classement
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
