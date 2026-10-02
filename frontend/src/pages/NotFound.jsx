import { Link } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you opened doesn't exist."
      action={<Link to="/"><Button>Back to home</Button></Link>}
    />
  )
}
