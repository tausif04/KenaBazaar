import { Outlet } from 'react-router-dom'

// Foundation stub. Later: redirect logged-in users away from /login, /register.
export default function PublicRoute() {
  return <Outlet />
}
