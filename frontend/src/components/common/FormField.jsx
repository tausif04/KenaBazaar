import { forwardRef, useId } from 'react'

const FormField = forwardRef(function FormField({ label, error, hint, type = 'text', ...props }, ref) {
    const id = useId()
    const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-900">
                {label}
            </label>
            <input
                id={id}
                ref={ref}
                type={type}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={describedBy}
                className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 ${error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                {...props}
            />
            {hint && !error && (
                <p id={`${id}-hint`} className="mt-1 text-xs text-gray-600">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
})

export default FormField