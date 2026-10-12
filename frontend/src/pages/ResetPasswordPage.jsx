import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import FormField from '../components/common/FormField'
import { useConfirmPasswordReset } from '../features/auth/passwordHooks'
import { applyServerErrors, setFormError } from '../utils/formErrors'
import { buttonClasses } from '../utils/ui'

const FIELDS = ['password', 'password2']

const schema = z
    .object({
        password: z.string().min(8, 'Use at least 8 characters'),
        password2: z.string().min(1, 'Please confirm your password'),
    })
    .refine((v) => v.password === v.password2, { message: 'Passwords do not match', path: ['password2'] })

// The backend answers a bad/expired link with 400 { detail: ... } (no field keys).
const isLinkError = (error) => {
    const data = error?.response?.data
    return error?.response?.status === 400 && !!data?.detail && !data.password && !data.password2
}

export default function ResetPasswordPage() {
    const { uid, token } = useParams()
    const navigate = useNavigate()
    const confirmReset = useConfirmPasswordReset()

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { password: '', password2: '' },
    })

    const onSubmit = (values) =>
        confirmReset.mutate(
            { uid, token, ...values },
            {
                onSuccess: () => {
                    toast.success('Password updated. Please log in.')
                    navigate('/login', { replace: true })
                },
                onError: (error) => {
                    if (isLinkError(error)) return // the page switches to the invalid-link state below
                    if (!applyServerErrors(error, setError, FIELDS)) setFormError(error, setError)
                },
            },
        )

    if (confirmReset.isError && isLinkError(confirmReset.error)) {
        return (
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center md:p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertTriangle className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold">This link is no longer valid</h1>
                <p className="mt-2 text-sm text-gray-600" role="alert">
                    Reset links expire and can only be used once. Request a new one to continue.
                </p>
                <Link to="/forgot-password" className={`${buttonClasses('primary', 'md')} mt-6 w-full`}>
                    Request a new link
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <h1 className="text-2xl font-bold">Choose a new password</h1>
            <p className="mt-1 text-sm text-gray-600">Enter a new password for your account.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                {errors.root && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errors.root.message}
                    </div>
                )}
                <FormField
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    hint="At least 8 characters. Avoid common passwords."
                    error={errors.password?.message}
                    {...register('password')}
                />
                <FormField
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    error={errors.password2?.message}
                    {...register('password2')}
                />
                <button type="submit" disabled={confirmReset.isPending} className={`${buttonClasses('primary', 'lg')} w-full`}>
                    {confirmReset.isPending ? 'Updating…' : 'Update password'}
                </button>
            </form>
        </div>
    )
}