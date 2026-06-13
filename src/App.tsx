import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Heart } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Patients = lazy(() => import('./pages/Patients').then(module => ({ default: module.Patients })));
const Agenda = lazy(() => import('./pages/Agenda').then(module => ({ default: module.Agenda })));
const Forms = lazy(() => import('./pages/Forms').then(module => ({ default: module.Forms })));
const YsqForm = lazy(() => import('./pages/YsqForm').then(module => ({ default: module.YsqForm })));
const CrisisCheckIn = lazy(() => import('./pages/CrisisCheckIn').then(module => ({ default: module.CrisisCheckIn })));
const DynamicFormRespondent = lazy(() => import('./pages/DynamicFormRespondent').then(module => ({ default: module.DynamicFormRespondent })));

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-card animate-pulse">
      <Heart className="loading-logo" size={48} />
      <h3>Agenda Clinical</h3>
      <p>Preparando seu consultório...</p>
      <div className="loading-bar">
        <div className="loading-progress"></div>
      </div>
    </div>
    <style>{`
      .loading-screen {
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #eaf2eb 0%, #dce8dd 100%);
      }
      .loading-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        background: white;
        padding: 32px 48px;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(43, 58, 48, 0.08);
        border: 1px solid rgba(255,255,255,0.6);
        text-align: center;
      }
      .loading-logo {
        color: #4a7c59;
      }
      .loading-card h3 {
        font-size: 1.4rem;
        color: #2b3a30;
        margin-top: 8px;
      }
      .loading-card p {
        font-size: 0.9rem;
        color: #5e6f64;
      }
      .loading-bar {
        width: 140px;
        height: 4px;
        background-color: #e8efe9;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 8px;
      }
      .loading-progress {
        width: 60%;
        height: 100%;
        background-color: #4a7c59;
        border-radius: 999px;
        animation: loading-anim 1.5s infinite ease-in-out;
      }
      @keyframes loading-anim {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
      .animate-pulse {
        animation: pulse-card 2s infinite ease-in-out;
      }
      @keyframes pulse-card {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
    `}</style>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const path = window.location.pathname;
  const isPublicRoute = path.startsWith('/responder-ysq') || path.startsWith('/crise') || path.startsWith('/responder-formulario');

  if (loading) {
    return <LoadingScreen />;
  }

  if (isPublicRoute) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/responder-ysq/:token" element={<YsqForm />} />
          <Route path="/crise/:token" element={<CrisisCheckIn />} />
          <Route path="/responder-formulario/:token" element={<DynamicFormRespondent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Se o profissional não estiver logado, exibe tela de login/cadastro
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Login />
      </Suspense>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/formularios" element={<Forms />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
