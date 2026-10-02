import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface HeaderProps {
    // Optional buttons/info shown on the right side
    children?: ReactNode
}

function Header({ children }: HeaderProps){
    return <>
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-800 bg-gray-950 px-4">
            <h1 className="shrink-0 text-sm font-semibold text-white">
                <Link to="/" className="hover:text-gray-300">
                    tsundre~ride
                </Link>
            </h1>
            {children && <div className="flex min-w-0 items-center gap-3">{children}</div>}
        </header>
    </>;
}

export default Header;
