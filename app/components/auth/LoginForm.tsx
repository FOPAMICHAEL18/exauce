'use client'
import { useState } from "react"
import { useAuth } from "@/app/hooks/useAuth"

const LoginForm = () => {
    const {login, loading} = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        //On effece l'erreur precedente
        setError('')

        if (!email || !password) {
            setError('Tous les champs doivent etre remplis')
            return
        }

        const result = await login(email,password)

        if (!result.success && result.message) {
            setError(result.message)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-[#0A1730] text-2xl font-bold">Connexion</h1>
                <span className="text-slate-400 text-sm">Accedez a votre espace d'administration</span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                    <label htmlFor="email" className="font-bold">Adresse e-mail</label>
                    <input type="email" name="email" id="email" placeholder="admin@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 block min-w-96 px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0A1730] focus:border-[#0A1730]" />
                </div>
                <div>
                    <label htmlFor="password" className="font-bold">Mot de passe</label>
                    <input type="password" name="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 block min-w-96 px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0A1730] focus:border-[#0A1730]" />
                </div>
                <button type="submit" disabled={loading} className="bg-[#0A1730] min-w-96 px-3 py-3 rounded-md mt-6 text-white font-medium border-transparent disabled:opacity-50 transition-colors cursor-pointer hover:bg-[#0A1730]/80">
                    {loading ? 'Connexion en cours...' : 'Se Connecter'}
                </button>
                {
                    error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
                    )
                }
            </form>
        </div>
    )
}

export {LoginForm}