import { useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'

// One reusable stub; each real page replaces it in its own phase.
export default function Placeholder({ title }) {
  const params = useParams()
  const values = Object.values(params)
  const suffix = values.length ? ` (${values.join(', ')})` : ''
  return <EmptyState title={`${title}${suffix}`} description="This screen is built in a later phase." />
}
