import { forwardRef, useId } from 'react'

// forwardRef so React Hook Form's register() works later.
const Input = forwardRef(function Input({ label, error, className = '', id, ...props }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={`h-10 rounded-md border bg-white px-3 text-sm placeholder:text-muted ${error ? 'border-danger-600' : 'border-line'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  )
})

export default Input
