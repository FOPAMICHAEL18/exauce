import { Children } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { AuthProvider } from "../contexts/AuthContext";

const Layout = ({children}: {children: React.ReactNode}) => {
    return (
        <AuthProvider>
            <AdminLayout>{children}</AdminLayout>
        </AuthProvider>
    )
}

export default Layout

