import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageWindow(page, total) {
    const pages = new Set([1, total, page - 1, page, page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) out.push('gap-' + p);
        out.push(p);
    });
    return out;
}

export default function Pagination({ page, count, pageSize, onChange, disabled = false }) {
    const total = Math.ceil(count / pageSize);
    if (total <= 1) return null;

    const btn =
        'flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button type="button" className={`${btn} border-gray-300 bg-white hover:bg-gray-50`} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {pageWindow(page, total).map((p) =>
                typeof p === 'string' ? (
                    <span key={p} className="px-1 text-gray-500" aria-hidden="true">…</span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        disabled={disabled}
                        aria-current={p === page ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                        onClick={() => onChange(p)}
                        className={`${btn} ${p === page ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
                    >
                        {p}
                    </button>
                )
            )}
            <button type="button" className={`${btn} border-gray-300 bg-white hover:bg-gray-50`} disabled={disabled || page >= total} onClick={() => onChange(page + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
        </nav>
    );
} 