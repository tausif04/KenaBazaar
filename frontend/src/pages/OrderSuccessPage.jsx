import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, SearchX, XCircle } from 'lucide-react'
import { useOrderPolling } from '../features/orders/hooks'
import { queryKeys } from '../api/queryKeys'
import { EmptyState, ErrorState } from '../components/common/StateMessage'
import { getErrorMessage } from '../utils/getErrorMessage'
import { formatPrice } from '../utils/format'
import { buttonClasses } from '../utils/ui'
import { useQueryClient } from '@tanstack/react-query'

const Card = ({ children }) => (
  <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-center md:p-8">{children}</div>
)

export default function OrderSuccessPage() {
  const [params] = useSearchParams()
  const raw = params.get('order')
  const orderId = raw && /^\d+$/.test(raw) ? raw : null

  const qc = useQueryClient()
  const { data: order, isLoading, isError, error, refetch, timedOut, checkAgain } = useOrderPolling(orderId)

  // The webhook deletes the cart when it marks the order paid, so refresh both caches.
  useEffect(() => {
    if (order?.status === 'paid') {
      qc.invalidateQueries({ queryKey: queryKeys.cart })
      qc.invalidateQueries({ queryKey: queryKeys.orders })
    }
  }, [order?.status, qc])

  if (!orderId) {
    return (
      <EmptyState
        icon={SearchX}
        title="No order to show"
        message="This page opens after a payment. Browse the store or check your orders."
        action={<Link to="/products" className={buttonClasses('primary')}>Browse products</Link>}
      />
    )
  }

  if (isError) {
    if (error?.response?.status === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title="Order not found"
          message="We couldn't find that order on your account."
          action={<Link to="/products" className={buttonClasses('primary')}>Browse products</Link>}
        />
      )
    }
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
  }

  if (isLoading || !order) {
    return (
      <Card>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600" role="status" />
        <p className="mt-4 text-sm text-gray-600">Loading your order…</p>
      </Card>
    )
  }

  if (order.status === 'paid') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">Payment received. Thank you!</h1>
          <p className="mt-1 text-sm text-gray-600" role="status">
            Order #{order.id}
            {order.paid_at && ` was paid on ${new Date(order.paid_at).toLocaleString()}`}.
          </p>
        </Card>

        <section aria-label="Order details" className="rounded-2xl border border-gray-200 bg-white p-6">
          <ul className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-600">
                    {item.sku} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatPrice(item.line_total)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 text-base">
            <span className="font-semibold">Total paid</span>
            <span className="font-bold">{formatPrice(order.total)}</span>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Shipping to</p>
            <p>{order.shipping_name} · {order.shipping_phone}</p>
            <p className="whitespace-pre-line">{order.shipping_address}</p>
          </div>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/products" className={buttonClasses('primary', 'md')}>Continue shopping</Link>
          <Link to="/orders" className={buttonClasses('outline', 'md')}>View my orders</Link>
        </div>
      </div>
    )
  }

  if (order.status === 'cancelled') {
    return (
      <Card>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <XCircle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold">This order was cancelled</h1>
        <p className="mt-2 text-sm text-gray-600">You haven't been charged. Your cart is still available.</p>
        <Link to="/cart" className={`${buttonClasses('primary', 'md')} mt-6`}>Back to cart</Link>
      </Card>
    )
  }

  // pending
  return (
    <Card>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        <Clock className="h-8 w-8" aria-hidden="true" />
      </div>
      {timedOut ? (
        <>
          <h1 className="text-2xl font-bold">We're still confirming your payment</h1>
          <p className="mt-2 text-sm text-gray-600" role="status">
            This is taking longer than usual. If you were charged, your order will update shortly. You can check again
            or come back later.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={checkAgain} className={buttonClasses('primary', 'md')}>Check again</button>
            <Link to="/orders" className={buttonClasses('outline', 'md')}>View my orders</Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-gray-600" role="status">
            Please keep this page open. This usually takes a few seconds.
          </p>
          <div className="mx-auto mt-5 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-600" aria-hidden="true" />
        </>
      )}
    </Card>
  )
}
