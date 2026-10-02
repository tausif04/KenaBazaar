import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" />
    </>
  )
}
