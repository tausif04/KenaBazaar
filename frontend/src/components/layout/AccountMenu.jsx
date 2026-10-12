import { Link } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'
import NavIconButton from './NavIconButton'
import { useAuth, useLogout } from '../../features/auth/hooks'

export default function AccountMenu({ mobile = false, onNavigate }) {
    const { user, isAuthenticated } = useAuth()
    const logout = useLogout()

    const name = user?.full_name?.trim().split(' ')[0] || user?.email?.split('@')[0] || 'Account'
    const handleLogout = () => {
        onNavigate?.()
        logout.mutate(undefined, { onSettled: () => toast.success('Logged out') })
    }

    if (!isAuthenticated) {
        return mobile ? (
            <Link
                to="/login"
                onClick={onNavigate}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800"
            >
                <User className="h-5 w-5" aria-hidden="true" /> Login
            </Link>
        ) : (
            <NavIconButton to="/login" icon={User} label="Login" showLabel />
        )
    }

    if (mobile) {
        return (
            <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 disabled:opacity-50"
            >
                <LogOut className="h-5 w-5" aria-hidden="true" /> Logout ({name})
            </button>
        )
    }

    return (
        <div className="flex items-center gap-1">
            <span className="hidden max-w-[8rem] truncate px-2 text-sm font-medium text-gray-700 xl:inline">Hi, {name}</span>
            <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                aria-label="Log out"
                className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-700 transition-colors hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50"
            >
                <LogOut className="h-6 w-6" aria-hidden="true" />
                <span className="hidden xl:inline">Logout</span>
            </button>
        </div>
    )
}