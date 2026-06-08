import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/Forgotpasswordpage';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', flexDirection:'column', gap:16 }}>
      <div style={{ width:50, height:50, borderRadius:14, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🌿</div>
      <div style={{ color:'var(--text2)', fontSize:14 }}>Loading MindEase…</div>
    </div>
  );
  return user ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:12, fontSize:13 },
              duration: 3500,
            }}
          />
          <Routes>
            <Route path="/"         element={<PublicRoute><AuthPage/></PublicRoute>}/>
            <Route path="/login"    element={<PublicRoute><AuthPage/></PublicRoute>}/>
            <Route path="/register" element={<PublicRoute><AuthPage/></PublicRoute>}/>

            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage/></PublicRoute>}/>
            <Route path="/reset-password"  element={<PublicRoute><ResetPasswordPage/></PublicRoute>}/>

            <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
            <Route path="*"          element={<Navigate to="/" replace/>}/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
