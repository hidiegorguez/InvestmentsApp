import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Wallet from './pages/Wallet';

// Componente para proteger rutas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userId } = useAuth();
  const params = useParams<{ userId: string }>();
  
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Si intenta acceder a la cartera de otro usuario, redirigir
  if (params.userId && params.userId !== userId) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Wrapper para la ruta del wallet que necesita verificar el userId de la URL
function WalletRoute() {
  return (
    <ProtectedRoute>
      <Wallet />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen" style={{ fontFamily: 'Inter, system-ui, Arial', backgroundColor: '#ffcc88' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/wallet/:userId/:asset" element={<WalletRoute />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
