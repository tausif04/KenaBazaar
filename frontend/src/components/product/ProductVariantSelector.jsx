import { variantLabel } from '../../utils/format';

export default function ProductVariantSelector({ variants = [], selectedId, onSelect }) {
    if (variants.length === 0) return null;
    return (
        <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-900">Options</legend>
            <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                    const selected = v.id === selectedId;
                    const out = v.stock <= 0;
                    return (
                        <button
                            key={v.id}
                            type="button"
                            disabled={out}
                            aria-pressed={selected}
                            onClick={() => onSelect(v.id)}
                            className={`min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-gray-400 disabled:line-through ${selected ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
                                }`}
                        >
                            {variantLabel(v)}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}