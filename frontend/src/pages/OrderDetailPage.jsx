import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, SearchX, XCircle } from 'lucide-react'
import { useOrder } from '../features/orders/hooks'
import OrderItemsList from '../components/orders/OrderItemsList'
import DeliveryTracker from '../components/orders/DeliveryTracker'
import { EmptyState, ErrorState } from '../components/common/StateMessage'
import { getErrorMessage } from '../utils/getErrorMessage'
import { buttonClasses } from '../utils/ui'

const BackLink = () => (
  <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-orange-600">
    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All orders
  </Link>
)

const Notice = ({ icon: Icon, tone, title, children }) => (
  <div className={`flex gap-3 rounded-2xl border p-5 ${tone}`} role="status">
    <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm">{children}</p>
    </div>
  </div>
)

export default function OrderDetailPage() {
  const { id } = useParams()
  const validId = /^\d+$/.test(id ?? '') ? id : null
  const { data: order, isLoading, isError, error, refetch } = useOrder(validId)

  const notFound = (
    <EmptyState
      icon={SearchX}
      title="Order not found"
      message="We couldn't find that order on your account."
      action={<Link to="/orders" className={buttonClasses('primary')}>Back to my orders</Link>}
    />
  )

  if (!validId) return notFound
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" role="status" aria-label="Loading order">
        <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }
  if (isError) {
    return error?.response?.status === 404
      ? notFound
      : <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
  }

  const placedOn = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <BackLink />
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <p className="text-sm text-gray-600">Placed on {placedOn}</p>
      </div>

      {order.status === 'pending' && (
        <Notice icon={Clock} tone="border-amber-200 bg-amber-50 text-amber-800" title="Awaiting payment confirmation">
          If you have just paid, this updates automatically within a few seconds.
        </Notice>
      )}

      {order.status === 'cancelled' && (
        <Notice icon={XCircle} tone="border-red-200 bg-red-50 text-red-800" title="This order was cancelled">
          You haven't been charged for it.
        </Notice>
      )}

      {order.status === 'paid' && <DeliveryTracker order={order} />}

      <section aria-label="Items" className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">Items</h2>
        <OrderItemsList
          items={order.items}
          total={order.total}
          totalLabel={order.status === 'paid' ? 'Total paid' : 'Total'}
        />
      </section>

      <section aria-label="Shipping address" className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
        <h2 className="mb-2 text-base font-semibold text-gray-900">Shipping to</h2>
        <p>{order.shipping_name} {'\u00b7'} {order.shipping_phone}</p>
        <p className="whitespace-pre-line">{order.shipping_address}</p>
      </section>
    </div>
  )
}
