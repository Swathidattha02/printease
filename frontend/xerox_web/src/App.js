import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import UsersDashboard from './pages/UsersDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import PrivateRoute from './components/PrivateRoute.jsx';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const isAuthPath = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/reset-password');
  const hideNavbar = isAdminPath || isDashboardPath || isAuthPath;

  return (
    <div className="App">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/dashboard" element={
          <PrivateRoute>
            <UsersDashboard />
          </PrivateRoute>
        } />

        <Route path="/admin" element={
          <PrivateRoute role="admin">
            <AdminDashboard />
          </PrivateRoute>
        } />

        {/* Non-dashboard pages wrapped in container to keep layout */}
        <Route path="/" element={<div className="container"><Landing /></div>} />
        <Route path="/login" element={<div className="container"><Login /></div>} />
        <Route path="/signup" element={<div className="container"><Signup /></div>} />
        <Route path="/reset-password/:token" element={<div className="container"><ResetPassword /></div>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <Router>
          <AppContent />
        </Router>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;
