import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import LandingPage from '@/pages/LandingPage';
import Transleitor from '@/pages/Transleitor';
import TemplatesSOAP from '@/pages/TemplatesSOAP';
import GerenciarApps from '@/pages/GerenciarApps';
import DevDocs from '@/pages/DevDocs';
import AdminLLMs from '@/pages/AdminLLMs';
import Monitoramento from '@/pages/Monitoramento';
import Seguranca from '@/pages/Seguranca';
import Passagem from '@/pages/Passagem';
import ImagemMedica from '@/pages/ImagemMedica';
import Elio from '@/pages/Elio';
import Capturas from '@/pages/Capturas';
import DescricaoCirurgia from '@/pages/DescricaoCirurgia';
import Menu from '@/pages/Menu';
import Especialidades from '@/pages/Especialidades';
import TransleitorEspecialidade from '@/pages/TransleitorEspecialidade';
import { ESPECIALIDADES_CONFIG } from '@/lib/especialidades';
import IdleTimeout from '@/components/IdleTimeout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <IdleTimeout />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/transleitor" element={<Transleitor />} />
          <Route path="/templates" element={<TemplatesSOAP />} />
          <Route path="/gerenciar-apps" element={<GerenciarApps />} />
          <Route path="/dev-docs" element={<DevDocs />} />
          <Route path="/admin-llms" element={<AdminLLMs />} />
          <Route path="/monitoramento" element={<Monitoramento />} />
          <Route path="/seguranca" element={<Seguranca />} />
          <Route path="/passagem" element={<Passagem />} />
          <Route path="/imagem-medica" element={<ImagemMedica />} />
          <Route path="/elio" element={<Elio />} />
          <Route path="/capturas" element={<Capturas />} />
          <Route path="/descricao-cirurgia" element={<DescricaoCirurgia />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/especialidades" element={<Especialidades />} />
          {Object.values(ESPECIALIDADES_CONFIG).map(esp => (
            <Route key={esp.slug} path={esp.rota} element={<TransleitorEspecialidade key={esp.slug} slug={esp.slug} />} />
          ))}
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App