import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { UserCheck, UserX, Clock } from 'lucide-react';
import type { Tournament, Player } from '@/types';

interface Props {
    tournament: Tournament;
    registrations: Player[];
}

const statusConfig: Record<string, { icon: typeof Clock; bg: string; text: string; label: string }> = {
    pending: { icon: Clock, bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'En attente' },
    approved: { icon: UserCheck, bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Approuvé' },
    rejected: { icon: UserX, bg: 'bg-red-500/10', text: 'text-red-400', label: 'Refusé' },
};

export default function Registrations({ tournament, registrations }: Props) {
    const updateStatus = (playerId: string, status: string) => {
        router.patch(route('registrations.update', [tournament.id, playerId]), { status }, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout tournament={tournament}>
            <Head title="Inscriptions" />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Inscriptions</h1>
                    <p className="text-sm text-muted-foreground">{registrations.length} inscription(s)</p>
                </div>
            </div>

            <div className="space-y-2">
                {registrations.map((player) => {
                    const config = statusConfig[player.registration_status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                        <div key={player.id} className="glass-card flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                                    <StatusIcon className={`w-4 h-4 ${config.text}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {player.email && <span>{player.email}</span>}
                                        <span>HC {player.handicap}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {player.registration_status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => updateStatus(player.id, 'approved')}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                                        >
                                            Approuver
                                        </button>
                                        <button
                                            onClick={() => updateStatus(player.id, 'rejected')}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                                        >
                                            Refuser
                                        </button>
                                    </>
                                )}
                                {player.registration_status !== 'pending' && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                                        {config.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {registrations.length === 0 && (
                    <div className="glass-card text-center py-8">
                        <p className="text-muted-foreground">Aucune inscription pour le moment.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
