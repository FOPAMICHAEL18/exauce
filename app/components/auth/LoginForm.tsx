'use client'

import { useState, useId } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import Router from 'next/router'
import { useRouter } from 'next/navigation'

const FALLBACK_ERROR = 'Impossible de vous connecter. Veuillez réessayer.'

const LoginForm = () => {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const errorId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Tous les champs doivent être remplis.')
      return
    }

    const result = await login(email.trim(), password)

    if (result.success) {
      router.push('/Admin/Dashboard')
    } else {
      setError(result.message || FALLBACK_ERROR)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#0A1730] text-2xl font-bold">Connexion</h1>
        <span className="text-slate-400 text-sm">
          Accédez à votre espace d&apos;administration
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-sm">
        <div>
          <label htmlFor="email" className="font-bold">
            Adresse e-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="admin@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            className="mt-2 block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A1730] focus:border-[#0A1730] disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="password" className="font-bold">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            className="mt-2 block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0A1730] focus:border-[#0A1730] disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-3 rounded-md mt-6 bg-[#0A1730] text-white font-medium border-transparent disabled:opacity-50 transition-colors cursor-pointer hover:bg-[#0A1730]/80"
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>

        {error && (
          <div
            id={errorId}
            role="alert"
            className="text-red-600 text-sm bg-red-50 p-2 rounded"
          >
            {error}
          </div>
        )}
      </form>
    </div>
  )
}

export { LoginForm }
export default LoginForm