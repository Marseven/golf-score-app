import { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Activity, Search, LogIn, LogOut, Eye, Plus, Pencil, Trash2, FileText, Target } from 'lucide-react';
import DataTable from '@/Components/DataTable';

interface Log {
    id: number;
    type: string;
    action: string;
    route_name: string | null;
    method: string | null;
    url: string | null;
    user_id: string | null;
    user_name: string | null;
    user_role: string | null;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
}

interface Props {
    logs: Log[];
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    login: { icon: LogIn, color: 'text-emerald-500 bg-emerald-500/10', label: 'Connexion' },
    logout: { icon: LogOut, color: 'text-amber-500 bg-amber-500/10', label: 'Déconnexion' },
    view: { icon: Eye, color: 'text-blue-500 bg-blue-500/10', label: 'Consultation' },
    create: { icon: Plus, color: 'text-violet-500 bg-violet-500/10', label: 'Création' },
    update: { icon: Pencil, color: 'text-orange-500 bg-orange-500/10', label: 'Modification' },
    delete: { icon: Trash2, color: 'text-red-500 bg-red-500/10', label: 'Suppression' },
    scoring: { icon: Target, color: 'text-primary bg-primary/10', label: 'Scoring' },
    export: { icon: FileText, color: 'text-pink-500 bg-pink-500/10', label: 'Export' },
    register: { icon: Plus, color: 'text-cyan-500 bg-cyan-500/10', label: 'Inscription' },
};

export default function AdminLogs({ logs }: Props) {
    const [filterType, setFilterType] = useState<string | null>(null);

    const types = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach((l) => { counts[l.type] = (counts[l.type] ?? 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [logs]);

    const filteredLogs = useMemo(() => {
        if (!filterType) return logs;
        return logs.filter((l) => l.type === filterType);
    }, [logs, filterType]);

    return (
        <AppLayout>
            <Head title="Journal d'activité" />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Journal d'activité</h1>
                    <p className="text-sm text-muted-foreground">{logs.length} actions enregistrées</p>
                </div>
            </div>

            {/* Type filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
                <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${!filterType ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>
                    Tous ({logs.length})
                </button>
                {types.map(([type, count]) => {
                    const config = typeConfig[type] ?? { color: 'text-muted-foreground bg-surface', label: type };
                    return (
                        <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterType === type ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground hover:bg-surface-hover'}`}>
                            {config.label} ({count})
                        </button>
                    );
                })}
            </div>

            <DataTable data={filteredLogs} searchKeys={['action', 'user_name', 'ip_address']} searchPlaceholder="Rechercher une action, utilisateur, IP..." defaultPerPage={25} perPageOptions={[25, 50, 100]}>
                {(paginatedLogs) => (
                    <div className="glass-card !p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-10">Type</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Action</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Utilisateur</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">IP</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {paginatedLogs.map((log) => {
                                        const config = typeConfig[log.type] ?? { icon: Eye, color: 'text-muted-foreground bg-surface', label: log.type };
                                        const Icon = config.icon;
                                        return (
                                            <tr key={log.id} className="hover:bg-surface/30 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                                                    {log.method && log.method !== 'GET' && (
                                                        <span className="text-[10px] text-muted-foreground font-mono">{log.method}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <p className="text-sm text-foreground">{log.user_name ?? '—'}</p>
                                                    {log.user_role && <span className="text-[10px] text-muted-foreground">{log.user_role}</span>}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs text-muted-foreground font-mono">{log.ip_address}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(log.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/60">
                                                        {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </DataTable>
        </AppLayout>
    );
}
