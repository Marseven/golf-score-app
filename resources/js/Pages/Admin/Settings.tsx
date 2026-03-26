import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PhoneInput from '@/Components/PhoneInput';
import { Save, Eye, EyeOff, Cog, Building2, Mail, CreditCard, Trophy, Upload, ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';

interface SettingsData {
    // General
    platform_name: string;
    club_name: string;
    club_email: string;
    club_phone: string;
    logo_url: string | null;
    sponsor_logo_url: string | null;
    // Email
    mail_from_address: string;
    mail_from_name: string;
    mail_host: string;
    mail_port: string;
    mail_username: string;
    mail_password: string;
    mail_password_set: boolean;
    mail_encryption: string;
    // Payment
    ebilling_username: string;
    ebilling_shared_key: string;
    ebilling_shared_key_set: boolean;
    ebilling_environment: string;
    // Tournaments
    default_currency: string;
    default_scoring_mode: string;
}

interface Props {
    settings: SettingsData;
}

interface TabDef {
    id: string;
    label: string;
    icon: any;
}

const tabs: TabDef[] = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'tournaments', label: 'Tournois', icon: Trophy },
];

function InputField({ label, value, onChange, type = 'text', placeholder, error, endAdornment }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    endAdornment?: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-sm text-muted-foreground block mb-1.5">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors pr-12"
                />
                {endAdornment && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {endAdornment}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, error }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    error?: string;
}) {
    return (
        <div>
            <label className="text-sm text-muted-foreground block mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors appearance-none"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

function SaveButton({ processing }: { processing: boolean }) {
    return (
        <div className="flex justify-end pt-2">
            <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50"
            >
                <Save className="w-4 h-4" />
                {processing ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
        </div>
    );
}

// --- General Tab ---
function GeneralTab({ settings }: { settings: SettingsData }) {
    const form = useForm({
        section: 'general',
        platform_name: settings.platform_name,
        club_name: settings.club_name,
        club_email: settings.club_email,
        club_phone: settings.club_phone,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const sponsorFileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [sponsorLogoPreview, setSponsorLogoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadingSponsor, setUploadingSponsor] = useState(false);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);

        setUploading(true);
        router.post(route('admin.settings.upload-logo'), { logo: file }, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    };

    const handleSponsorLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setSponsorLogoPreview(reader.result as string);
        reader.readAsDataURL(file);

        setUploadingSponsor(true);
        router.post(route('admin.settings.upload-sponsor-logo'), { sponsor_logo: file }, {
            forceFormData: true,
            onFinish: () => setUploadingSponsor(false),
        });
    };

    const displayLogo = logoPreview || settings.logo_url;
    const displaySponsorLogo = sponsorLogoPreview || settings.sponsor_logo_url;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('admin.settings.update'));
    };

    return (
        <div className="space-y-6">
            {/* Logo upload */}
            <div>
                <label className="text-sm text-muted-foreground block mb-2">Logo du club</label>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden">
                        {displayLogo ? (
                            <img src={displayLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                        )}
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Envoi...' : 'Changer le logo'}
                        </button>
                        <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG, WebP ou SVG. Max 2 Mo.</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            hidden
                        />
                    </div>
                </div>
            </div>

            {/* Sponsor logo upload */}
            <div>
                <label className="text-sm text-muted-foreground block mb-2">Logo sponsor (écran TV)</label>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden">
                        {displaySponsorLogo ? (
                            <img src={displaySponsorLogo} alt="Sponsor" className="w-full h-full object-contain" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                        )}
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => sponsorFileInputRef.current?.click()}
                            disabled={uploadingSponsor}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4" />
                            {uploadingSponsor ? 'Envoi...' : 'Logo sponsor'}
                        </button>
                        <p className="text-xs text-muted-foreground mt-1.5">Affiché en haut à droite de l'écran TV.</p>
                        <input
                            ref={sponsorFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSponsorLogoChange}
                            hidden
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                    label="Nom de la plateforme"
                    value={form.data.platform_name}
                    onChange={(v) => form.setData('platform_name', v)}
                    placeholder="MGC Score"
                    error={form.errors.platform_name}
                />
                <InputField
                    label="Nom du club"
                    value={form.data.club_name}
                    onChange={(v) => form.setData('club_name', v)}
                    placeholder="Manga Golf Club"
                    error={form.errors.club_name}
                />
                <InputField
                    label="Email de contact"
                    value={form.data.club_email}
                    onChange={(v) => form.setData('club_email', v)}
                    type="email"
                    placeholder="contact@mangagolfclub.com"
                    error={form.errors.club_email}
                />
                <PhoneInput
                    label="Téléphone de contact"
                    value={form.data.club_phone}
                    onChange={(v) => form.setData('club_phone', v)}
                    error={form.errors.club_phone}
                />
                <SaveButton processing={form.processing} />
            </form>
        </div>
    );
}

// --- Email Tab ---
function EmailTab({ settings }: { settings: SettingsData }) {
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm({
        section: 'email',
        mail_from_address: settings.mail_from_address,
        mail_from_name: settings.mail_from_name,
        mail_host: settings.mail_host,
        mail_port: settings.mail_port,
        mail_username: settings.mail_username,
        mail_password: settings.mail_password_set ? settings.mail_password : '',
        mail_encryption: settings.mail_encryption,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('admin.settings.update'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label="Adresse expéditeur"
                    value={form.data.mail_from_address}
                    onChange={(v) => form.setData('mail_from_address', v)}
                    type="email"
                    placeholder="noreply@mangagolfclub.com"
                    error={form.errors.mail_from_address}
                />
                <InputField
                    label="Nom expéditeur"
                    value={form.data.mail_from_name}
                    onChange={(v) => form.setData('mail_from_name', v)}
                    placeholder="MGC Score"
                    error={form.errors.mail_from_name}
                />
            </div>
            <InputField
                label="Serveur SMTP"
                value={form.data.mail_host}
                onChange={(v) => form.setData('mail_host', v)}
                placeholder="smtp.gmail.com"
                error={form.errors.mail_host}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label="Port SMTP"
                    value={form.data.mail_port}
                    onChange={(v) => form.setData('mail_port', v)}
                    placeholder="587"
                    error={form.errors.mail_port}
                />
                <SelectField
                    label="Chiffrement"
                    value={form.data.mail_encryption}
                    onChange={(v) => form.setData('mail_encryption', v)}
                    options={[
                        { value: 'tls', label: 'TLS' },
                        { value: 'ssl', label: 'SSL' },
                        { value: 'none', label: 'Aucun' },
                    ]}
                    error={form.errors.mail_encryption}
                />
            </div>
            <InputField
                label="Nom d'utilisateur SMTP"
                value={form.data.mail_username}
                onChange={(v) => form.setData('mail_username', v)}
                placeholder="votre@email.com"
                error={form.errors.mail_username}
            />
            <InputField
                label="Mot de passe SMTP"
                value={form.data.mail_password}
                onChange={(v) => form.setData('mail_password', v)}
                type={showPassword ? 'text' : 'password'}
                placeholder={settings.mail_password_set ? 'Laisser vide pour garder le mot de passe actuel' : 'Mot de passe SMTP'}
                error={form.errors.mail_password}
                endAdornment={
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                }
            />
            <SaveButton processing={form.processing} />
        </form>
    );
}

// --- Payment Tab ---
function PaymentTab({ settings }: { settings: SettingsData }) {
    const [showKey, setShowKey] = useState(false);

    const form = useForm({
        section: 'payment',
        ebilling_username: settings.ebilling_username,
        ebilling_shared_key: settings.ebilling_shared_key_set ? settings.ebilling_shared_key : '',
        ebilling_environment: settings.ebilling_environment,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('admin.settings.update'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
                label="Username eBilling"
                value={form.data.ebilling_username}
                onChange={(v) => form.setData('ebilling_username', v)}
                placeholder="Votre identifiant eBilling"
                error={form.errors.ebilling_username}
            />
            <InputField
                label="Shared Key"
                value={form.data.ebilling_shared_key}
                onChange={(v) => form.setData('ebilling_shared_key', v)}
                type={showKey ? 'text' : 'password'}
                placeholder={settings.ebilling_shared_key_set ? 'Laisser vide pour garder la clé actuelle' : 'Votre clé partagée eBilling'}
                error={form.errors.ebilling_shared_key}
                endAdornment={
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                }
            />
            <SelectField
                label="Environnement"
                value={form.data.ebilling_environment}
                onChange={(v) => form.setData('ebilling_environment', v)}
                options={[
                    { value: 'lab', label: 'LAB (Test)' },
                    { value: 'prod', label: 'Production' },
                ]}
                error={form.errors.ebilling_environment}
            />
            <SaveButton processing={form.processing} />
        </form>
    );
}

// --- Tournaments Tab ---
function TournamentsTab({ settings }: { settings: SettingsData }) {
    const form = useForm({
        section: 'tournaments',
        default_currency: settings.default_currency,
        default_scoring_mode: settings.default_scoring_mode,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('admin.settings.update'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField
                label="Devise par défaut"
                value={form.data.default_currency}
                onChange={(v) => form.setData('default_currency', v)}
                options={[
                    { value: 'XAF', label: 'XAF (Franc CFA)' },
                    { value: 'EUR', label: 'EUR (Euro)' },
                    { value: 'USD', label: 'USD (Dollar US)' },
                ]}
                error={form.errors.default_currency}
            />
            <SelectField
                label="Mode de scoring par défaut"
                value={form.data.default_scoring_mode}
                onChange={(v) => form.setData('default_scoring_mode', v)}
                options={[
                    { value: 'stroke_play', label: 'Stroke Play' },
                    { value: 'stableford', label: 'Stableford' },
                    { value: 'both', label: 'Les deux' },
                ]}
                error={form.errors.default_scoring_mode}
            />
            <SaveButton processing={form.processing} />
        </form>
    );
}

export default function AdminSettings({ settings }: Props) {
    const [activeTab, setActiveTab] = useState('general');

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

            <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-2 px-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="max-w-2xl">
                <div className="glass-card">
                    {activeTab === 'general' && <GeneralTab settings={settings} />}
                    {activeTab === 'email' && <EmailTab settings={settings} />}
                    {activeTab === 'payment' && <PaymentTab settings={settings} />}
                    {activeTab === 'tournaments' && <TournamentsTab settings={settings} />}
                </div>
            </div>
        </AppLayout>
    );
}
