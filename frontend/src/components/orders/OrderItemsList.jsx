import { formatPrice } from '../../utils/format'

// Shared by the order detail page (and reusable by the success page).
export default function OrderItemsList({ items = [], total, totalLabel = 'Total' }) {
  return (
    <>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{item.product_name}</p>
              <p className="text-xs text-gray-600">
                {item.sku} {'\u00d7'} {item.quantity}
              </p>
            </div>
            <p className="shrink-0 font-semibold">{formatPrice(item.line_total)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 text-base">
        <span className="font-semibold">{totalLabel}</span>
        <span className="font-bold">{formatPrice(total)}</span>
      </div>
    </>
  )
}
