import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
    label: string
    href?: string // Facultatif : la dernière étape n'a pas de lien
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
    return (
        <div className=" border-y border-gray-200 py-4">
            <nav aria-label="breadcrumb" className="container mx-auto px-4 flex items-center gap-2 text-xs text-gray-500 font-medium ">
                <Link href="/" className="hover:text-[#0A1730] transition-colors">
                    Accueil
                </Link>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            {isLast || !item.href ? (
                                <span className="text-[#0A1730] font-semibold">{item.label}</span>
                            ) : (
                                <Link href={item.href} className="hover:text-[#0A1730] transition-colors">
                                    {item.label}
                                </Link>
                            )}
                        </div>
                    )
                })}
            </nav>
        </div>
    )
}

export default Breadcrumb