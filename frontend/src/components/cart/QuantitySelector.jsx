import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ value, onChange, min = 1, max, disabled = false, label = 'Quantity' }) {
    const atMin = value <= min;
    const atMax = max != null && value >= max;
    const btn =
        'flex h-11 w-11 items-center justify-center text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-40';
    return (
        <div role="group" aria-label={label} className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white">
            <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={disabled || atMin} aria-label="Decrease quantity">
                <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-10 text-center text-sm font-semibold text-gray-900" aria-live="polite">{value}</span>
            <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={disabled || atMax} aria-label="Increase quantity">
                <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}