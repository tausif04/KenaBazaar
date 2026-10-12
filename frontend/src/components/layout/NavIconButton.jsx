import { NavLink } from 'react-router-dom';

export default function NavIconButton({ to, icon: Icon, label, count = 0, showLabel = false }) {
    return (
        <NavLink
            to={to}
            aria-label={count > 0 ? `${label}, ${count} items` : label}
            className={({ isActive }) =>
                `relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${isActive ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                }`
            }
        >
            <span className="relative">
                <Icon className="h-6 w-6" aria-hidden="true" />
                {count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </span>
            {showLabel && <span className="hidden xl:inline">{label}</span>}
        </NavLink>
    );
}