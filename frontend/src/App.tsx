import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import ChallanList from './pages/challans/ChallanList';
import ChallanCreate from './pages/challans/ChallanCreate';
import ChallanDetail from './pages/challans/ChallanDetail';
import UserList from './pages/users/UserList';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          
          <Route path="products" element={<ProductList />} />
          <Route path="products/:id" element={<ProductDetail />} />
          
          <Route path="challans" element={<ChallanList />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SALES']} />}>
            <Route path="challans/new" element={<ChallanCreate />} />
          </Route>
          <Route path="challans/:id" element={<ChallanDetail />} />
          
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="users" element={<UserList />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
