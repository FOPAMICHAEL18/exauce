"use client"
import {usePathname} from 'next/navigation'
import Link from 'next/link'

interface NavlinkProps {
    href: string,
    children: React.ReactNode,
    activeClassName?: string,
    className?: string,
    exact?: boolean,
    onClick?: () => void
}

const Navlink = ({href, children, activeClassName, className, exact, onClick}: NavlinkProps) => {
    const pathname= usePathname()
    //Determine si le lien est actif 
    const isActive = (exact || href === '/') ? pathname === href : pathname.startsWith(href)
    return (
        <Link onClick={onClick} href={href}> <span className={`${className} ${isActive? activeClassName : ''}`}>{children}</span> </Link>
    )
} 

export default Navlink  