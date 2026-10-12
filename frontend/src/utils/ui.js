const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-50';

const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 disabled:hover:bg-orange-600',
    outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
};

const sizes = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
};

export const buttonClasses = (variant = 'primary', size = 'md') =>
    `${base} ${variants[variant]} ${sizes[size]}`;