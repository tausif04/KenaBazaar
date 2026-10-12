import { useMutation } from '@tanstack/react-query'
import { createCheckoutSession } from '../../api/orders.api'

export const useCreateCheckoutSession = () => useMutation({ mutationFn: createCheckoutSession })
