import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import { User } from 'lucide-react';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeleteUserForm from './Partials/DeleteUserForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AppLayout>
            <Head title="Mon profil" />

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
                    <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
                </div>
            </div>

            <div className="max-w-xl space-y-6">
                <div className="glass-card">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </div>

                <div className="glass-card">
                    <UpdatePasswordForm />
                </div>

                <div className="glass-card">
                    <DeleteUserForm />
                </div>
            </div>
        </AppLayout>
    );
}
