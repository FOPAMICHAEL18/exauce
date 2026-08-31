import { prisma } from "@/app/lib/prisma";
import AdminContactForm from "@/app/components/admin/AdminContactForm";

const Contact = async () => {

    return (
        <div className="space-y-6 px-20 py-4">
            <AdminContactForm />
        </div>
    )
}

export default Contact