/* v8 ignore file */
import AdminCategoryForm from "@/app/components/admin/AdminCategoryForm";

const NewCategory = async () => {
    return (
        <div className="space-y-6 px-20 py-40">
            {/* Formulaire d'édition */}
            <AdminCategoryForm />
        </div>
    );
}

export default NewCategory