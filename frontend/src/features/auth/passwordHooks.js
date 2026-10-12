import { useMutation } from '@tanstack/react-query'
import { confirmPasswordReset, requestPasswordReset } from '../../api/auth.api'

export const useRequestPasswordReset = () => useMutation({ mutationFn: requestPasswordReset })

export const useConfirmPasswordReset = () => useMutation({ mutationFn: confirmPasswordReset })