import { useState, useEffect } from "react"
import {useRouter} from 'next/navigation'
import { apiCall } from "../lib/api"

interface LoginCredentials {
    email: string,
    password: string
}

interface AdminUser {
    id: number,
    email: string,
    name: string
}

interface LoginResponse {
    success: boolean,
    token: string,
    admin: AdminUser,
    message?: string
}
/**
 * Hook personnalise pour gerer l'authentification
 * il gere : login, logout, verification du token etat de chargement
 */

const useAuth = () => {
    const router = useRouter()
    const  [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<AdminUser | null>(null)

    // Verification du token au chargement
    useEffect(() => {
        const token = localStorage.getItem('adminToken')

        if (token) {
            //Si un token existe on considere que l'utilisateur est connecter 
            setIsAuthenticated(true)

            try {
                //On decode le token pour recuperer les infos
                const payload = JSON.parse(atob(token.split('.')[1]))
                setUser({
                    id: payload.adminId,
                    email: payload.email,
                    name: payload.name
                })
            } catch (error) {
                //Si le token est invalide , on le supprime
                localStorage.removeItem('adminToken')
                setIsAuthenticated(false)
            }
        }
        setLoading(false)
    }, [])
    
    //Fonction de connexion
    const login = async (email: string, password: string) => {
        setLoading(true)

        try {
            const response = await apiCall<LoginResponse> ('/api/admin/login', {
                method: 'POST',
                body: JSON.stringify({email, password})
            })

            if (response.success && response.data) {
                //succes: on stocke le token
                localStorage.setItem('adminToken', response.data.token)
                setIsAuthenticated(true)
                setUser(response.data.admin)
                // ✅ REDIRECTION AVEC RECHARGEMENT COMPLET
                window.location.href = '/Admin/Dashboard'
                return {success: true}
            }
            else {
                return {
                    success: false,
                    message: response.message || response.data?.message || 'identifiants incorrects'
                }
            }
        } catch (error) {
            return {
                success: false,
                message: 'Erreur de connexion au serveur'
            }
        }
        finally {
            setLoading(false)
        }
    }

    //Deconnexion
    const logout = () => {
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
        setUser(null)
        router.push('/Admin/Login')
    }

    return {
        isAuthenticated,
        loading,
        user,
        login,
        logout
    }
}

export {useAuth}