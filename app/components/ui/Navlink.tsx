"use client"
import {usePathname} from 'next/navigation'
import Link from 'next/link'

interface NavlinkProps {
    href: string,
    children: React.ReactNode,
    activeClassName?: string,
    className?: string,
    exact?: boolean
}

const Navlink = ({href, children, activeClassName, className, exact}: NavlinkProps) => {
    const pathname= usePathname()
    //Determine si le lien est actif 
    const isActive = (exact || href === '/') ? pathname === href : pathname.startsWith(href)
    return (
        <Link href={href}> <span className={`${className} ${isActive? activeClassName : ''}`}>{children}</span> </Link>
    )
} 

export default Navlink  