import { useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';

export default function UpdateAvatarForm({ status }: { status?: string }) {
    const user = usePage().props.auth.user;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        router.post(route('profile.avatar'), { avatar: file }, {
            forceFormData: true,
            onFinish: () => {
                setUploading(false);
                setPreview(null);
            },
        });
    };

    const avatarSrc = preview || user.avatar_url;

    return (
        <section>
            <header>
                <h2 className="text-lg font-semibold text-foreground">
                    Photo de profil
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ajoutez ou modifiez votre photo de profil.
                </p>
            </header>

            <div className="mt-6 flex items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-surface-hover border-2 border-border overflow-hidden flex items-center justify-center">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
                    >
                        {uploading ? 'Envoi...' : 'Changer la photo'}
                    </button>
                    <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG ou WebP. Max 2 Mo.</p>
                </div>
            </div>

            {status === 'avatar-updated' && (
                <p className="mt-3 text-sm text-emerald-400">Photo mise a jour.</p>
            )}
        </section>
    );
}
