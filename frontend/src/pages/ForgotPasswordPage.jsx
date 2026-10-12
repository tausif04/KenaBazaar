import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import FormField from '../components/common/FormField'
import { useRequestPasswordReset } from '../features/auth/passwordHooks'
import { applyServerErrors, setFormError } from '../utils/formErrors'
import { buttonClasses } from '../utils/ui'

const schema = z.object({
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
})

export default function ForgotPasswordPage() {
    const requestReset = useRequestPasswordReset()

    const {
        register,
        handleSubmit,
        setError,
        getValues,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } })

    const onSubmit = ({ email }) =>
        requestReset.mutate(email, {
            onError: (error) => {
                if (!applyServerErrors(error, setError, ['email'])) setFormError(error, setError)
            },
        })

    if (requestReset.isSuccess) {
        return (
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center md:p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
                    <Mail className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold">Check your email</h1>
                <p className="mt-2 text-sm text-gray-600" role="status">
                    If an account exists for <span className="font-medium text-gray-900">{getValues('email')}</span>, we've sent a
                    link to reset your password.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => requestReset.reset()}
                        className={`${buttonClasses('outline', 'md')} w-full`}
                    >
                        Use a different email
                    </button>
                    <Link to="/login" className={`${buttonClasses('primary', 'md')} w-full`}>
                        Back to log in
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-1 text-sm text-gray-600">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                {errors.root && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errors.root.message}
                    </div>
                )}
                <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                <button type="submit" disabled={requestReset.isPending} className={`${buttonClasses('primary', 'lg')} w-full`}>
                    {requestReset.isPending ? 'Sending…' : 'Send reset link'}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600">
                Remembered it?{' '}
                <Link to="/login" className="font-medium text-orange-600 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    )
}