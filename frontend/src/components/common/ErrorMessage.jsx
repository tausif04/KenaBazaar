import { AlertCircle } from 'lucide-react'
import Button from './Button'

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-600/30 bg-danger-50 p-4">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger-600" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm text-danger-600">{message}</p>
        {onRetry && <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button>}
      </div>
    </div>
  )
}
