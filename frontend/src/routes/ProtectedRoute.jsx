import { Outlet } from 'react-router-dom'

// Foundation stub: passes everyone through. The auth phase will read
// state.auth.isAuthenticated and redirect to /login when false.
export default function ProtectedRoute() {
  return <Outlet />
}
