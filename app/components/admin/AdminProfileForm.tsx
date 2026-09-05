"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/app/hooks/useProfile';

const AdminProfileForm = () => {
    const router = useRouter();
    const { data, loading, error, success, updateProfile, refresh } = useProfile();

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [localSuccess, setLocalSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null)

    useEffect(() => {
        if (data) {
        setName(data.name || '');
        setSurname(data.surname || '');
        setEmail(data.email || '');
        }
    }, [data]);

    useEffect(() => {
        if (error) setLocalError(error);
        if (success) {
        setLocalSuccess(true);
        setTimeout(() => setLocalSuccess(false), 3000);
        }
    }, [error, success]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null);
        setLocalSuccess(false);
        setPasswordError(null);
        setIsSubmitting(true);

        // 1. Vérifier si au moins un champ texte a changé par rapport aux données initiales
        const hasTextChanged =
            name.trim() !== (data?.name || '') ||
            surname.trim() !== (data?.surname || '') ||
            email.trim() !== (data?.email || '');

        const isChangingPassword = Boolean(newPassword || confirmPassword);

        // 🎯 Si aucune donnée texte n'a changé ET aucun mot de passe n'est saisi
        if (!hasTextChanged && !isChangingPassword) {
            setLocalError('Aucune modification détectée');
            setIsSubmitting(false)
            return;
        }

        // Vérification du mot de passe
        if (isChangingPassword) {
            if (newPassword !== confirmPassword) {
                setPasswordError('Les mots de passe ne correspondent pas');
                setIsSubmitting(false);
                return;
            }
            if (newPassword.length < 6) {
                setPasswordError('Le mot de passe doit faire au moins 6 caractères');
                setIsSubmitting(false);
                return;
            }
            if (!currentPassword) {
                setPasswordError('Veuillez entrer votre mot de passe actuel');
                setIsSubmitting(false);
                return;
            }
        }


        const payload: Record<string, string> = {
            name: name.trim(),
            surname: surname.trim(),
            email: email.trim(),
        };

        if (newPassword && currentPassword) {
            payload.currentPassword = currentPassword;
            payload.newPassword = newPassword;
        }


        const result = await updateProfile(payload);
        setIsSubmitting(false);

        if (result) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Re-synchronise avec le serveur pour confirmer que les données persistent
            await refresh();
        }
    }

    if (loading) {
        return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-200 rounded-xl h-96"></div>
                <div className="bg-gray-200 rounded-xl"></div>
            </div>
        </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {localError}
                </div>
            )}
            {localSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                    Profile mis à jour avec succès !
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 space-y-5 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">Profil du vendeur</h2>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Nom / pseudo *
                        </label>
                        <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900"
                        placeholder="Ouelou"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            prenom
                        </label>
                        <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900"
                        placeholder="Jean-Baptiste"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            E-mail
                        </label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900"
                        placeholder="contact@maison-ebene.cm"
                        />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 space-y-5 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">Changer le mot de passe</h2>

                    {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {passwordError}
                        </div>
                    )}

                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Mot de passe actuel
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            Nouveau mot de passe
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900"
                            placeholder="•••••••• (minimum 6 caractères)"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirmer le nouveau mot de passe
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1730]/20 focus:border-[#0A1730] transition-all placeholder:text-gray-400 text-gray-900"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-4 pt-2">
                <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#0A1730] text-white text-sm font-semibold rounded-lg hover:bg-[#0A1730]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                type="button"
                onClick={() => router.push('/Admin/Dashboard')}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                Annuler
                </button>
            </div>
        </form>
    )
}

export default AdminProfileForm