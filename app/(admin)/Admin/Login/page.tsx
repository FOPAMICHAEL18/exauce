import { useAuth } from "@/app/hooks/useAuth"
import { apiCall } from "@/app/lib/api"
import { LoginForm } from "@/app/components/auth/LoginForm"



const Login = () => {
    return (
        <div className="flex flex-1 flex-row overflow-hidden">
            <div className="bg-[#0A1730] h-screen min-w-1/2 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.15)_0%,transparent_80%)]">
                <div className="flex flex-col gap-4 relative ">
                    <h1 className="text-white text-3xl font-semibol tracking-tightd">Espace vendeur</h1>
                    <span className=" max-w-md leading-relaxed text-slate-400">
                        Gerez vos produits, vos categories et les avis de vos client depuis un espace dedie, securise et simple d'utlisation.
                    </span>
                </div>
            </div>
            <div className="min-h-screen flex justify-center items-center w-full">
                <LoginForm />
            </div>
        </div>
    )
}

export default Login