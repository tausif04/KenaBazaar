import { useEffect, useId, useState } from 'react';
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBar({ className = '', autoFocus = false, onSubmitted }) {
    const id = useId();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [value, setValue] = useState(params.get('search') ?? '');

    useEffect(() => { setValue(params.get('search') ?? ''); }, [params]);

    const submit = (e) => {
        e.preventDefault();
        const q = value.trim();
        navigate({ pathname: '/products', search: q ? `?${createSearchParams({ search: q })}` : '' });
        onSubmitted?.();
    };

    return (
        <form onSubmit={submit} role="search" className={`flex ${className}`}>
            <label htmlFor={id} className="sr-only">Search products</label>
            <input
                id={id}
                type="search"
                value={value}
                autoFocus={autoFocus}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search for products"
                className="h-11 w-full rounded-l-lg border border-r-0 border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
                type="submit"
                aria-label="Search"
                className="flex h-11 w-12 items-center justify-center rounded-r-lg bg-orange-600 text-white transition-colors hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
                <Search className="h-5 w-5" aria-hidden="true" />
            </button>
        </form>
    );
}