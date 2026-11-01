import { Check, Circle } from 'lucide-react'

// delivery_status values the backend sends once an order is paid.
const RANK = { processing: 0, shipped: 1, delivered: 2 }

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
      })
    : null

// Pure display: the backend decides the state; we only map it to steps.
function buildSteps(order) {
  const paid = order.status === 'paid'
  // Paid orders from before delivery tracking existed have no delivery_status: treat as processing.
  const rank = paid ? RANK[order.delivery_status] ?? 0 : -1

  return [
    { key: 'placed', label: 'Order placed', done: true, at: order.created_at },
    { key: 'paid', label: 'Payment confirmed', done: paid, at: order.paid_at },
    {
      key: 'shipped', label: 'Shipped', done: rank >= 1, at: order.shipped_at,
      hint: 'We are preparing your order.',
    },
    {
      key: 'delivered', label: 'Delivered', done: rank >= 2, at: order.delivered_at,
      hint: 'On its way to you.',
    },
  ]
}

export default function DeliveryTracker({ order }) {
  const steps = buildSteps(order)
  const currentIndex = steps.findIndex((s) => !s.done)

  return (
    <section aria-label="Delivery status" className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Delivery status</h2>

      <ol>
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex
          const isLast = i === steps.length - 1
          return (
            <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'border-2 border-orange-500 bg-white text-orange-500'
                      : 'border-2 border-gray-200 bg-white text-gray-300'
                }`}
              >
                {step.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Circle className="h-2 w-2 fill-current" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${step.done || isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.label}
                  {step.done && <span className="sr-only"> (completed)</span>}
                  {isCurrent && <span className="sr-only"> (current step)</span>}
                </p>
                {step.done && fmt(step.at) && <p className="text-xs text-gray-600">{fmt(step.at)}</p>}
                {isCurrent && step.hint && <p className="text-xs text-orange-700">{step.hint}</p>}
              </div>
            </li>
          )
        })}
      </ol>

      {order.tracking_number && (
        <div className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Tracking</p>
          <p>
            {order.courier ? `${order.courier} \u00b7 ` : ''}
            <span className="font-mono">{order.tracking_number}</span>
          </p>
        </div>
      )}
    </section>
  )
}
