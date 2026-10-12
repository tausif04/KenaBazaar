import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import FormField from '../components/common/FormField'
import { useAuth, useRegister } from '../features/auth/hooks'
import { applyServerErrors, setFormError } from '../utils/formErrors'
import { buttonClasses } from '../utils/ui'

const FIELDS = ['email', 'full_name', 'password', 'password2']

const schema = z
    .object({
        email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
        full_name: z.string().trim().max(150, 'Name is too long'),
        password: z.string().min(8, 'Use at least 8 characters'),
        password2: z.string().min(1, 'Please confirm your password'),
    })
    .refine((v) => v.password === v.password2, { message: 'Passwords do not match', path: ['password2'] })

export default function RegisterPage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const registerUser = useRegister()

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: '', full_name: '', password: '', password2: '' },
    })

    if (isAuthenticated) return <Navigate to="/" replace />

    const onSubmit = (values) =>
        registerUser.mutate(values, {
            onSuccess: () => {
                toast.success('Account created. Please log in.')
                navigate('/login', { replace: true, state: { email: values.email } })
            },
            onError: (error) => {
                if (!applyServerErrors(error, setError, FIELDS)) setFormError(error, setError)
            },
        })

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-gray-600">Save your wishlist and check out faster.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                {errors.root && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errors.root.message}
                    </div>
                )}
                <FormField label="Full name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
                <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                <FormField
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    hint="At least 8 characters. Avoid common passwords."
                    error={errors.password?.message}
                    {...register('password')}
                />
                <FormField
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    error={errors.password2?.message}
                    {...register('password2')}
                />
                <button type="submit" disabled={registerUser.isPending} className={`${buttonClasses('primary', 'lg')} w-full`}>
                    {registerUser.isPending ? 'Creating account…' : 'Create account'}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-orange-600 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    )
}