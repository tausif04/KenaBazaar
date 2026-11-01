import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { getOrder, getOrders } from '../../api/orders.api'

const POLL_MS = 2000
const POLL_LIMIT_MS = 40000

export const useOrders = () => useQuery({ queryKey: queryKeys.orders, queryFn: getOrders })

// Order detail. Keeps itself fresh while the order is on its way: refetches every minute
// until delivered/cancelled, and (TanStack default) whenever the tab regains focus.
const SETTLED = ['delivered', 'cancelled']
const DETAIL_POLL_MS = 60000

export const useOrder = (id) =>
  useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
    refetchInterval: (q) => {
      const o = q.state.data
      if (!o) return false
      return SETTLED.includes(o.delivery_status) || o.status === 'cancelled' ? false : DETAIL_POLL_MS
    },
  })

// Polls while the order is pending (the webhook is what flips it to paid), then stops.
export function useOrderPolling(id) {
  const startedAt = useRef(Date.now())
  const [attempt, setAttempt] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (status && status !== 'pending') return false
      return Date.now() - startedAt.current < POLL_LIMIT_MS ? POLL_MS : false
    },
  })

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS)
    return () => clearTimeout(timer)
  }, [id, attempt])

  const checkAgain = () => {
    startedAt.current = Date.now()
    setTimedOut(false)
    setAttempt((n) => n + 1)
    query.refetch()
  }

  return { ...query, timedOut, checkAgain }
}
