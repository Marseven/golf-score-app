import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users, Plus, Pencil, Trash2, X, Save, Shield, Eye, EyeOff } from 'lucide-react';

interface UserItem {
    id: string;
    name: string;
    email: string;
    created_at: string;
    roles: string[];
}

interface Props {
    users: UserItem[];
}

const roleConfig: Record<string, { label: string; badge: string }> = {
    admin: { label: 'Admin', badge: 'bg-red-500/10 text-red-500 dark:text-red-400 ring-1 ring-red-500/20' },
    captain: { label: 'Capitaine', badge: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20' },
    marker: { label: 'Marqueur', badge: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20' },
};

const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'captain', label: 'Capitaine' },
    { value: 'marker', label: 'Marqueur' },
];

export default function AdminUsers({ users }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm({
        name: '',
        email: '',
        password: '',
        roles: [] as string[],
    });

    const openCreate = () => {
        setEditingUser(null);
        form.reset();
        form.clearErrors();
        setShowPassword(false);
        setShowModal(true);
    };

    const openEdit = (user: UserItem) => {
        setEditingUser(user);
        form.setData({
            name: user.name,
            email: user.email,
            password: '',
            roles: [...user.roles],
        });
        form.clearErrors();
        setShowPassword(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const toggleRole = (role: string) => {
        const current = form.data.roles;
        if (current.includes(role)) {
            form.setData('roles', current.filter((r) => r !== role));
        } else {
            form.setData('roles', [...current, role]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            form.put(route('admin.users.update', editingUser.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            form.post(route('admin.users.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (user: UserItem) => {
        if (!confirm(`Supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`)) return;
        router.delete(route('admin.users.destroy', user.id));
    };

    return (
        <AppLayout>
            <Head title="Utilisateurs" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
                        <p className="text-sm text-muted-foreground">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Ajouter
                </button>
            </div>

            {users.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                        <Users className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">Aucun utilisateur</h3>
                    <p className="text-sm text-muted-foreground mb-6">Ajoutez des utilisateurs pour gérer les accès.</p>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter un utilisateur
                    </button>
                </div>
            ) : (
                <div className="glass-card !p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Nom</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Email</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Rôles</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Inscrit le</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-medium text-foreground">{user.name}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-muted-foreground">{user.email}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role) => {
                                                        const config = roleConfig[role];
                                                        return config ? (
                                                            <span key={role} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.badge}`}>
                                                                {config.label}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">Aucun rôle</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative w-full max-w-md mx-4 bg-sidebar border border-border rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Shield className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Nom</label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Nom complet"
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                {form.errors.name && <p className="text-xs text-destructive mt-1">{form.errors.name}</p>}
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="email@exemple.com"
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                {form.errors.email && <p className="text-xs text-destructive mt-1">{form.errors.email}</p>}
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">
                                    Mot de passe{editingUser ? ' (laisser vide pour ne pas changer)' : ''}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        placeholder={editingUser ? 'Nouveau mot de passe' : 'Mot de passe'}
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-foreground focus:border-primary focus:outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {form.errors.password && <p className="text-xs text-destructive mt-1">{form.errors.password}</p>}
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Rôles</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableRoles.map((role) => {
                                        const isSelected = form.data.roles.includes(role.value);
                                        const config = roleConfig[role.value];
                                        return (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => toggleRole(role.value)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                                    isSelected
                                                        ? config.badge
                                                        : 'bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-border'
                                                }`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                                                    isSelected ? 'border-current bg-current/20' : 'border-muted-foreground/30'
                                                }`}>
                                                    {isSelected && (
                                                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 12 12">
                                                            <path d="M10.28 2.28L4.75 7.81 1.72 4.78a.75.75 0 00-1.06 1.06l3.75 3.75a.75.75 0 001.06 0l6.25-6.25a.75.75 0 00-1.06-1.06z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                {role.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {form.errors.roles && <p className="text-xs text-destructive mt-1">{form.errors.roles}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-surface transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    {form.processing ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
