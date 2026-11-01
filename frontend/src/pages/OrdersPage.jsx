import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useOrders } from '../features/orders/hooks'
import { EmptyState, ErrorState } from '../components/common/StateMessage'
import { getErrorMessage } from '../utils/getErrorMessage'
import { formatPrice } from '../utils/format'
import { buttonClasses } from '../utils/ui'

const STATUS_STYLES = {
    paid: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-700',
}

const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '\u2014'

function StatusBadge({ status }) {
    const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}>{status}</span>
    )
}

function OrdersSkeleton() {
    return (
        <div className="space-y-4" role="status" aria-label="Loading orders">
            {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
            ))}
        </div>
    )
}

function OrderRow({ order }) {
    const summary = (order.items ?? [])
        .map((i) => `${i.product_name} \u00d7 ${i.quantity}`)
        .join(', ')

    return (
        <Link
            to={`/orders/${order.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-semibold text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{formatDate(order.paid_at ?? order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>
            {summary && <p className="mt-3 truncate text-sm text-gray-600">{summary}</p>}
            <p className="mt-2 text-right font-bold">{formatPrice(order.total)}</p>
        </Link>
    )
}

export default function OrdersPage() {
    const { data, isLoading, isError, error, refetch } = useOrders()

    let body
    if (isLoading) {
        body = <OrdersSkeleton />
    } else if (isError) {
        body = <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
    } else if (data.length === 0) {
        body = (
            <EmptyState
                icon={Package}
                title="No orders yet"
                message="When you place an order, it will show up here."
                action={<Link to="/products" className={buttonClasses('primary')}>Start shopping</Link>}
            />
        )
    } else {
        body = (
            <ul className="space-y-4">
                {data.map((order) => (
                    <li key={order.id}><OrderRow order={order} /></li>
                ))}
            </ul>
        )
    }

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold">My orders</h1>
            {body}
        </div>
    )
}
