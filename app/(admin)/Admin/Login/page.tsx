import { useAuth } from "@/app/hooks/useAuth"
import { apiCall } from "@/app/lib/api"
import { LoginForm } from "@/app/components/auth/LoginForm"



const Login = () => {
    return (
        <div className="min-h-screen w-full flex bg-gray-50">
            <div className="hidden md:flex md:w-1/2 bg-[#0A1730] text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
                />
                <div className="relative z-10 flex items-center font-semibold text-lg tracking-wide text-white/90">
                    exauce
                </div>
                <div className="relative z-10 my-auto space-y-4 max-w-md">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-blue-200 border border-white/10">Espace vendeur</div>
                    <h2 className=" text-3xl lg:text-4xl font-extrabold leading-tight text-white">
                        Gérez votre plateforme en toute simplicité.
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Accédez à vos outils d'administration, vos statistiques et la gestion de vos données au même endroit.
                    </p>
                </div>
                <div className="relative z-10 text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} exauce. Tous droits réservés.
                </div>
            </div>
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
                <LoginForm />
            </div>
        </div>
    )
}

export default Login