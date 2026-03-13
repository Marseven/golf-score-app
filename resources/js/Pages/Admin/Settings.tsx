import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Save, Eye, EyeOff, Cog, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface Props {
    settings: {
        ebilling_username: string;
        ebilling_shared_key: string;
        ebilling_shared_key_set: boolean;
        ebilling_environment: string;
    };
}

export default function AdminSettings({ settings }: Props) {
    const [showKey, setShowKey] = useState(false);

    const form = useForm({
        ebilling_username: settings.ebilling_username,
        ebilling_shared_key: settings.ebilling_shared_key_set ? settings.ebilling_shared_key : '',
        ebilling_environment: settings.ebilling_environment,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('admin.settings.update'));
    };

    return (
        <AppLayout>
            <Head title="Paramètres" />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Cog className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
                    <p className="text-sm text-muted-foreground">Configuration globale de l'application</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                <div className="glass-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">eBilling</h2>
                            <p className="text-xs text-muted-foreground">Identifiants de paiement Billing-Easy</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Username</label>
                            <input
                                type="text"
                                value={form.data.ebilling_username}
                                onChange={(e) => form.setData('ebilling_username', e.target.value)}
                                placeholder="Votre identifiant eBilling"
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                            {form.errors.ebilling_username && (
                                <p className="text-xs text-destructive mt-1">{form.errors.ebilling_username}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Shared Key</label>
                            <div className="relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={form.data.ebilling_shared_key}
                                    onChange={(e) => form.setData('ebilling_shared_key', e.target.value)}
                                    placeholder={settings.ebilling_shared_key_set ? 'Laisser vide pour garder la clé actuelle' : 'Votre clé partagée eBilling'}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.errors.ebilling_shared_key && (
                                <p className="text-xs text-destructive mt-1">{form.errors.ebilling_shared_key}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground block mb-1.5">Environnement</label>
                            <select
                                value={form.data.ebilling_environment}
                                onChange={(e) => form.setData('ebilling_environment', e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors appearance-none"
                            >
                                <option value="lab">LAB (Test)</option>
                                <option value="prod">Production</option>
                            </select>
                            {form.errors.ebilling_environment && (
                                <p className="text-xs text-destructive mt-1">{form.errors.ebilling_environment}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {form.processing ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
