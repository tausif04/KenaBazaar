import { AlertTriangle } from 'lucide-react';
import { buttonClasses } from '../../utils/ui';

export function EmptyState({ icon: Icon, title, message, action }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            {Icon && (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Icon className="h-8 w-8" aria-hidden="true" />
                </div>
            )}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {message && <p className="mt-1 max-w-sm text-sm text-gray-600">{message}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div role="alert" className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-red-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">We couldn't load this</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-700">{message}</p>
            {onRetry && (
                <button type="button" onClick={onRetry} className={`${buttonClasses('outline')} mt-5`}>
                    Try again
                </button>
            )}
        </div>
    );
}