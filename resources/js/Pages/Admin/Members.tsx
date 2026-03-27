import { useState, useMemo, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Contact, Plus, Pencil, Trash2, X, Save, Search, Upload, Download } from 'lucide-react';
import type { Member } from '@/types';

interface Props {
    members: Member[];
}

function downloadCsvTemplate() {
    const headers = ['first_name', 'last_name', 'email', 'phone', 'handicap_index'];
    const sampleRows = [
        ['Jean', 'Dupont', 'jean@example.com', '+241066000000', '12.5'],
        ['Marie', 'Martin', 'marie@example.com', '+241077000000', '5.2'],
    ];
    const csv = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'membres_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

export default function AdminMembers({ members }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        handicap_index: 54.0,
        status: 'active' as 'active' | 'inactive',
    });

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        const q = searchQuery.toLowerCase();
        return members.filter(
            (m) =>
                m.first_name.toLowerCase().includes(q) ||
                m.last_name.toLowerCase().includes(q) ||
                m.member_code.toLowerCase().includes(q) ||
                (m.email && m.email.toLowerCase().includes(q))
        );
    }, [members, searchQuery]);

    const openCreate = () => {
        setEditingMember(null);
        form.reset();
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (member: Member) => {
        setEditingMember(member);
        form.setData({
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email || '',
            phone: member.phone || '',
            handicap_index: member.handicap_index,
            status: member.status,
        });
        form.clearErrors();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMember(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            form.put(route('admin.members.update', editingMember.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            form.post(route('admin.members.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (member: Member) => {
        if (!confirm(`Supprimer le membre "${member.first_name} ${member.last_name}" ? Cette action est irréversible.`)) return;
        router.delete(route('admin.members.destroy', member.id));
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        router.post(route('admin.members.import'), { file }, {
            forceFormData: true,
            onSuccess: () => {
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    // Classification preview
    const previewCategoryType = form.data.handicap_index < 7 ? 'professional' : 'amateur';

    return (
        <AppLayout>
            <Head title="Membres" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Contact className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Membres du club</h1>
                        <p className="text-sm text-muted-foreground">{members.length} membre{members.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadCsvTemplate}
                        className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-surface transition-colors"
                        title="Télécharger template CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-surface transition-colors cursor-pointer" title="Importer CSV">
                        <Upload className="w-4 h-4" />
                        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport} className="hidden" />
                    </label>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, code, email..."
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                />
            </div>

            {filteredMembers.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                        <Contact className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                        {searchQuery ? 'Aucun résultat' : 'Aucun membre'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        {searchQuery ? 'Essayez avec d\'autres termes de recherche.' : 'Ajoutez des membres du club pour les gérer.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un membre
                        </button>
                    )}
                </div>
            ) : (
                <div className="glass-card !p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Code</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Nom</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Email</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Handicap</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Classification</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Statut</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-surface/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono text-muted-foreground">{member.member_code}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-medium text-foreground">{member.first_name} {member.last_name}</span>
                                        </td>
                                        <td className="px-5 py-3.5 hidden sm:table-cell">
                                            <span className="text-sm text-muted-foreground">{member.email || '-'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="text-sm font-medium text-foreground">{member.handicap_index}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {member.category_type === 'professional' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                                    PRO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20">
                                                    AM
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            {member.status === 'active' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-500/10 text-gray-500 dark:text-gray-400 ring-1 ring-gray-500/20">
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(member)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member)}
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
                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                    <Contact className="w-4.5 h-4.5 text-violet-500 dark:text-violet-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {editingMember ? 'Modifier le membre' : 'Nouveau membre'}
                                </h2>
                            </div>
                            <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Member code (read-only when editing) */}
                            {editingMember && (
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1.5">Code membre</label>
                                    <input
                                        type="text"
                                        value={editingMember.member_code}
                                        readOnly
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground font-mono text-sm opacity-60 cursor-not-allowed"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1.5">Prénom</label>
                                    <input
                                        type="text"
                                        value={form.data.first_name}
                                        onChange={(e) => form.setData('first_name', e.target.value)}
                                        placeholder="Jean"
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                    />
                                    {form.errors.first_name && <p className="text-xs text-destructive mt-1">{form.errors.first_name}</p>}
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1.5">Nom</label>
                                    <input
                                        type="text"
                                        value={form.data.last_name}
                                        onChange={(e) => form.setData('last_name', e.target.value)}
                                        placeholder="Dupont"
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                    />
                                    {form.errors.last_name && <p className="text-xs text-destructive mt-1">{form.errors.last_name}</p>}
                                </div>
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
                                <label className="text-sm text-muted-foreground block mb-1.5">Téléphone</label>
                                <input
                                    type="text"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="+241 06 000 000"
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                {form.errors.phone && <p className="text-xs text-destructive mt-1">{form.errors.phone}</p>}
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1.5">Index handicap</label>
                                <input
                                    type="number"
                                    value={form.data.handicap_index}
                                    onChange={(e) => form.setData('handicap_index', parseFloat(e.target.value) || 0)}
                                    step={0.1}
                                    min={0}
                                    max={54}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                                />
                                {form.errors.handicap_index && <p className="text-xs text-destructive mt-1">{form.errors.handicap_index}</p>}
                                {/* Classification preview */}
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Classification :</span>
                                    {previewCategoryType === 'professional' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                            PRO
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20">
                                            AM
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground/70">(index &lt; 7 = Pro)</span>
                                </div>
                            </div>

                            {/* Status (only when editing) */}
                            {editingMember && (
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1.5">Statut</label>
                                    <select
                                        value={form.data.status}
                                        onChange={(e) => form.setData('status', e.target.value as 'active' | 'inactive')}
                                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="active">Actif</option>
                                        <option value="inactive">Inactif</option>
                                    </select>
                                </div>
                            )}

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
                                    {form.processing ? 'Enregistrement...' : editingMember ? 'Mettre à jour' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
