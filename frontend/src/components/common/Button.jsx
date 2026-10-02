const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-100 disabled:text-brand-700',
  secondary: 'border border-line bg-white text-ink hover:bg-surface',
  ghost: 'text-ink hover:bg-surface',
}
const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
