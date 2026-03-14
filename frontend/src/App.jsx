import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductCreate from './pages/ProductCreate'
import Receipts from './pages/Receipts'
import ReceiptCreate from './pages/ReceiptCreate'
import Delivery from './pages/Delivery'
import DeliveryCreate from './pages/DeliveryCreate'
import Adjustments from './pages/Adjustments'
import MoveHistory from './pages/MoveHistory'
import Settings from './pages/Settings'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import Reports from './pages/Reports'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Operations - Accessible to Both Roles */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/receipts/new" element={<ReceiptCreate />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/delivery/new" element={<DeliveryCreate />} />
        <Route path="/adjustments" element={<Adjustments />} />
        <Route path="/move-history" element={<MoveHistory />} />

        {/* Manager Only Features */}
        <Route path="/products" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><Products /></ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><ProductCreate /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><ProductCreate /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><Suppliers /></ProtectedRoute>} />
        <Route path="/purchase-orders" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['INVENTORY_MANAGER']}><Settings /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
