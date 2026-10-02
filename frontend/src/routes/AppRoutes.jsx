import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PublicRoute from './PublicRoute'
import ProtectedRoute from './ProtectedRoute'
import Placeholder from '../pages/Placeholder'
import NotFound from '../pages/NotFound'

const page = (title) => <Placeholder title={title} />

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={page('Home')} />
        <Route path="/products" element={page('Products')} />
        <Route path="/products/:id" element={page('Product detail')} />
        <Route path="/cart" element={page('Cart')} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={page('Login')} />
          <Route path="/register" element={page('Register')} />
          <Route path="/forgot-password" element={page('Forgot password')} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/wishlist" element={page('Wishlist')} />
          <Route path="/orders" element={page('Orders')} />
          <Route path="/orders/:id" element={page('Order detail')} />
          <Route path="/account" element={page('Account')} />
          <Route path="/seller/*" element={page('Seller panel')} />
          <Route path="/admin/*" element={page('Admin panel')} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
