import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import ProductCard from '../product/ProductCard'
import { ErrorState } from '../common/StateMessage'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { discountPercent } from '../../utils/format'
import { SALE_ENDS_AT } from '../../config/site'

const pad = (n) => String(n).padStart(2, '0')

function Countdown({ endsAt }) {
  const [left, setLeft] = useState(() => endsAt - Date.now())
  useEffect(() => {
    const t = setInterval(() => setLeft(endsAt - Date.now()), 1000)
    return () => clearInterval(t)
  }, [endsAt])
  if (left <= 0) return null

  const total = Math.floor(left / 1000)
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
  return (
    <div role="timer" aria-label="Time left in the sale" className="mt-4">
      <p className="mb-1 text-xs font-medium text-gray-700">Ends in</p>
      <div className="flex items-center gap-1 font-mono text-lg font-bold">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="rounded-md bg-gray-900 px-2 py-1 text-white">{pad(p)}</span>
            {i < 2 && <span aria-hidden="true">:</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DealsSection({ deals, isLoading, error, onRetry }) {
  if (!isLoading && !error && deals.length === 0) return null

  const best = Math.max(0, ...deals.map(discountPercent))

  return (
    <section id="deals" aria-labelledby="deals-title"
      className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="shrink-0 rounded-xl bg-white p-5 shadow-sm lg:w-60">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="deals-title" className="mt-3 text-2xl font-extrabold text-gray-900">Deals</h2>
          {best > 0 && <p className="mt-1 font-semibold text-orange-600">Up to {best}% off</p>}
          <p className="mt-1 text-sm text-gray-600">
            {isLoading ? 'Finding deals\u2026' : `${deals.length} product${deals.length === 1 ? '' : 's'} on sale right now`}
          </p>
          {SALE_ENDS_AT && <Countdown endsAt={SALE_ENDS_AT} />}
        </div>

        <div className="min-w-0 flex-1">
          {error ? (
            <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
          ) : (
            <ul
              tabIndex={0}
              aria-label="Products on sale (scroll sideways for more)"
              className="flex snap-x gap-3 overflow-x-auto pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {isLoading
                ? [1, 2, 3, 4].map((n) => (
                    <li key={n} className="h-80 w-44 shrink-0 animate-pulse rounded-xl bg-gray-200 sm:w-52" />
                  ))
                : deals.map((p) => (
                    <li key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
                      <ProductCard product={p} />
                    </li>
                  ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
