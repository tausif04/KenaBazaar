import { Link, Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import FormField from '../components/common/FormField'
import { useAuth, useLogin } from '../features/auth/hooks'
import { setFormError } from '../utils/formErrors'
import { buttonClasses } from '../utils/ui'

const schema = z.object({
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
    const location = useLocation()
    const { isAuthenticated } = useAuth()
    const login = useLogin()
    const from = location.state?.from?.pathname ?? '/'

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: location.state?.email ?? '', password: '' },
    })

    if (isAuthenticated) return <Navigate to={from} replace />

    const onSubmit = (values) =>
        login.mutate(values, {
            onSuccess: () => toast.success('Welcome back!'),
            onError: (error) => setFormError(error, setError),
        })

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <h1 className="text-2xl font-bold">Log in</h1>
            <p className="mt-1 text-sm text-gray-600">Welcome back to KenaBazaar.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                {errors.root && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {errors.root.message}
                    </div>
                )}
                <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                <FormField
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register('password')}
                />
                <button type="submit" disabled={login.isPending} className={`${buttonClasses('primary', 'lg')} w-full`}>
                    {login.isPending ? 'Logging in…' : 'Log in'}
                </button>
            </form>

            <div className="mt-5 flex flex-col gap-2 text-center text-sm text-gray-600">
                <Link to="/forgot-password" className="font-medium text-orange-600 hover:underline">
                    Forgot your password?
                </Link>
                <span>
                    New here?{' '}
                    <Link to="/register" className="font-medium text-orange-600 hover:underline">
                        Create an account
                    </Link>
                </span>
            </div>
        </div>
    )
}