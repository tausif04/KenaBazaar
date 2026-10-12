import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from '../features/cart/hooks'
import { useAuth } from '../features/auth/hooks'
import { useCreateCheckoutSession } from '../features/checkout/hooks'
import { selectCartItems, selectCartTotal } from '../api/cart.api'
import FormField from '../components/common/FormField'
import { EmptyState, ErrorState } from '../components/common/StateMessage'
import { applyServerErrors, setFormError } from '../utils/formErrors'
import { getErrorMessage } from '../utils/getErrorMessage'
import { formatPrice, variantLabel } from '../utils/format'
import { buttonClasses } from '../utils/ui'

const FIELDS = ['shipping_name', 'shipping_phone', 'shipping_address']

const schema = z.object({
    shipping_name: z.string().trim().min(2, 'Enter the recipient name').max(150, 'Name is too long'),
    shipping_phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number'),
    shipping_address: z.string().trim().min(10, 'Enter the full delivery address'),
})

// Only ever send the browser to Stripe's hosted checkout.
const isStripeUrl = (value) => {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com'
    } catch {
        return false
    }
}

function AddressField({ error, ...props }) {
    const id = useId()
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-900">
                Delivery address
            </label>
            <textarea
                id={id}
                rows={3}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 ${error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                {...props}
            />
            {error && (
                <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}

export default function CheckoutPage() {
    const { user } = useAuth()
    const { data: cart, isLoading, isError, error, refetch } = useCart()
    const checkout = useCreateCheckoutSession()
    const [redirecting, setRedirecting] = useState(false)

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { shipping_name: user?.full_name ?? '', shipping_phone: '', shipping_address: '' },
    })

    const items = selectCartItems(cart)

    const onSubmit = (values) =>
        checkout.mutate(values, {
            onSuccess: ({ checkout_url }) => {
                if (!isStripeUrl(checkout_url)) {
                    toast.error('Unexpected payment address. Please try again.')
                    return
                }
                setRedirecting(true)
                window.location.assign(checkout_url)
            },
            onError: (err) => {
                if (!applyServerErrors(err, setError, FIELDS)) setFormError(err, setError)
                refetch() // stock may have changed, so show the current cart
            },
        })

    if (isLoading) {
        return (
            <div className="grid animate-pulse gap-6 lg:grid-cols-3" aria-busy="true">
                <div className="h-96 rounded-xl bg-gray-200 lg:col-span-2" />
                <div className="h-64 rounded-xl bg-gray-200" />
            </div>
        )
    }
    if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
    if (items.length === 0 && !redirecting) {
        return (
            <EmptyState
                icon={ShoppingBag}
                title="Your cart is empty"
                message="Add something to your cart before checking out."
                action={<Link to="/products" className={buttonClasses('primary')}>Browse products</Link>}
            />
        )
    }

    const busy = checkout.isPending || redirecting

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
            <div className="grid gap-6 lg:grid-cols-3">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2"
                >
                    <h2 className="text-lg font-bold">Shipping details</h2>
                    {errors.root && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {errors.root.message}
                        </div>
                    )}
                    <FormField label="Recipient name" autoComplete="name" error={errors.shipping_name?.message} {...register('shipping_name')} />
                    <FormField label="Phone number" type="tel" autoComplete="tel" error={errors.shipping_phone?.message} {...register('shipping_phone')} />
                    <AddressField autoComplete="street-address" error={errors.shipping_address?.message} {...register('shipping_address')} />

                    <button type="submit" disabled={busy} className={`${buttonClasses('primary', 'lg')} w-full`}>
                        {busy ? 'Redirecting to secure payment…' : 'Continue to payment'}
                    </button>
                    <p className="text-center text-xs text-gray-600">
                        You'll pay on Stripe's secure page. We never see your card details.
                    </p>
                    {import.meta.env.DEV && (
                        <p className="text-center text-xs text-gray-500">Test mode: use card 4242 4242 4242 4242, any future date, any CVC.</p>
                    )}
                </form>

                <aside aria-label="Order summary" className="h-fit rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24">
                    <h2 className="text-lg font-bold">Order summary</h2>
                    <ul className="mt-4 divide-y divide-gray-100">
                        {items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-900">{item.product.name}</p>
                                    <p className="text-xs text-gray-600">
                                        {variantLabel(item.variant)} × {item.quantity}
                                    </p>
                                </div>
                                <p className="shrink-0 font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 text-base">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">{formatPrice(selectCartTotal(cart))}</span>
                    </div>
                    <Link to="/cart" className="mt-4 block text-center text-sm font-medium text-orange-600 hover:underline">
                        Edit cart
                    </Link>
                </aside>
            </div>
        </div>
    )
}