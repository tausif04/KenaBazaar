import { useState } from 'react';

export default function ProductImageGallery({ images = [], name }) {
    const ordered = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
    const [active, setActive] = useState(0);
    const current = ordered[active];

    if (ordered.length === 0) {
        return <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">No image available</div>;
    }

    return (
        <div>
            <div className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <img src={current.image} alt={current.alt_text || name} className="h-full w-full object-cover" />
            </div>
            {ordered.length > 1 && (
                <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Product images">
                    {ordered.map((img, i) => (
                        <li key={img.id}>
                            <button
                                type="button"
                                onClick={() => setActive(i)}
                                aria-label={`Show image ${i + 1}`}
                                aria-current={i === active}
                                className={`aspect-square w-full overflow-hidden rounded-lg border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${i === active ? 'border-orange-600' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <img src={img.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}